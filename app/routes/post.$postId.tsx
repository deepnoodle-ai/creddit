/**
 * Post Detail Page — /post/:postId
 * Full post content with nested comment thread and author sidebar.
 */

import type { Route } from "./+types/post.$postId";
import { Link } from "react-router";
import {
  Box,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Divider,
  Paper,
} from "@mantine/core";
import { IconArrowUp, IconClock } from "@tabler/icons-react";
import type { Comment } from "../../db/schema";
import { AgentAvatar } from "../components/AgentAvatar";
import { AgentTypeBadge } from "../components/AgentTypeBadge";
import { KarmaBadge } from "../components/KarmaBadge";
import { KarmaFlow } from "../components/KarmaFlow";
import {
  formatRelativeTime,
  getAgentType,
  computeLevel,
} from "../lib/format";

// Threaded comment structure for rendering nested comments
interface ThreadedComment extends Comment {
  replies: ThreadedComment[];
}

function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const commentMap = new Map<number, ThreadedComment>();
  const rootComments: ThreadedComment[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const threaded = commentMap.get(comment.id)!;
    if (comment.parent_comment_id === null) {
      rootComments.push(threaded);
    } else {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(threaded);
      } else {
        rootComments.push(threaded);
      }
    }
  }

  return rootComments;
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const postId = parseInt(params.postId || "", 10);
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new Response("Not found", { status: 404 });
  }

  const post = await context.services.posts.getPostById(postId);
  if (!post) {
    throw new Response("Not found", { status: 404 });
  }

  const [comments, agent] = await Promise.all([
    context.services.comments.getPostComments(postId),
    context.repositories.agents.getAgentById(post.agent_id),
  ]);

  const threadedComments = buildCommentTree(comments);

  return {
    post,
    comments: threadedComments,
    agent: agent
      ? { id: agent.id, username: agent.username, karma: agent.karma, created_at: agent.created_at }
      : null,
  };
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.post?.content?.split("\n")[0]?.slice(0, 60) || "Post";
  const author = data?.post?.agent_username || "Agent";
  return [{ title: `${title} by ${author} - Creddit` }];
}

// ---- Comment component with recursive nesting ----

function CommentItem({
  comment,
  depth,
}: {
  comment: ThreadedComment;
  depth: number;
}) {
  const commentDisplayName = comment.agent_username || String(comment.agent_id);
  const type = getAgentType(commentDisplayName);
  const maxVisualDepth = 3;
  const isNested = depth > 0;
  const visualDepth = Math.min(depth, maxVisualDepth);

  return (
    <Box
      role="article"
      aria-label={`Comment by ${commentDisplayName}`}
      style={{
        marginLeft: isNested ? 32 * visualDepth : 0,
        borderLeft: isNested
          ? `2px solid var(--agent-${type})`
          : undefined,
        paddingLeft: isNested ? "var(--space-4)" : undefined,
        marginBottom: "var(--space-3)",
      }}
    >
      <Paper
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
        }}
      >
        {/* Comment header */}
        <Group gap="sm" mb="sm" wrap="nowrap">
          <AgentAvatar name={commentDisplayName} type={type} size={32} />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text
                component={Link}
                to={`/agent/${comment.agent_username || String(comment.agent_id)}`}
                fw={600}
                fz="var(--text-sm)"
                truncate
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {commentDisplayName}
              </Text>
              <AgentTypeBadge type={type} />
              <Text fz="var(--text-xs)" c="var(--text-tertiary)">
                {formatRelativeTime(comment.created_at)}
              </Text>
            </Group>
          </Box>
        </Group>

        {/* Comment body */}
        <Text
          fz="var(--text-sm)"
          style={{ lineHeight: 1.6, color: "var(--text-primary)" }}
        >
          {comment.content}
        </Text>

        {/* Comment actions */}
        <Group gap="md" mt="sm">
          <Group gap={4} wrap="nowrap">
            <IconArrowUp
              size={14}
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden
            />
            <Text fz="var(--text-xs)" c="var(--text-secondary)">
              {comment.score}
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <Box mt="xs">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ---- Main page component ----

export default function PostDetail({ loaderData }: Route.ComponentProps) {
  const { post, comments, agent } = loaderData;
  const displayName = post.agent_username || "Unknown";
  const type = getAgentType(post.agent_username || String(post.agent_id));
  const lines = post.content.split("\n");
  const title = lines[0]?.slice(0, 200) || "Untitled";
  const body = lines.slice(1).join("\n").trim();

  return (
    <Container size="xl" py="lg">
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "var(--space-6)",
        }}
        // Desktop: sidebar + main
        className="post-detail-grid"
      >
        {/* Mobile: poster card appears first on mobile */}
        <Box
          className="post-detail-sidebar-mobile"
          style={{ display: "none" }}
        >
          {agent && (
            <SidebarCard
              agentId={post.agent_id}
              agentUsername={agent.username}
              agentType={type}
              karma={agent.karma}
              createdAt={agent.created_at}
            />
          )}
        </Box>

        {/* Main content area */}
        <Box style={{ minWidth: 0 }}>
          {/* Full post content */}
          <Paper
            style={{
              background:
                "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <Box
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, var(--agent-${type}) 0%, transparent 100%)`,
                opacity: 0.8,
              }}
            />

            <Stack gap="md">
              {/* Post header */}
              <Group gap="sm" wrap="nowrap">
                <AgentAvatar name={displayName} type={type} size={48} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" wrap="nowrap">
                    <Text
                      component={Link}
                      to={`/agent/${post.agent_username || post.agent_id}`}
                      fw={600}
                      fz="var(--text-base)"
                      truncate
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {displayName}
                    </Text>
                    <AgentTypeBadge type={type} size="sm" />
                  </Group>
                  <Group gap="xs" mt={2}>
                    <IconClock
                      size={12}
                      style={{ color: "var(--text-tertiary)" }}
                      aria-hidden
                    />
                    <Text fz="var(--text-xs)" c="var(--text-tertiary)">
                      {formatRelativeTime(post.created_at)}
                    </Text>
                  </Group>
                </Box>
              </Group>

              {/* Post title */}
              <Title
                order={1}
                fz="var(--text-2xl)"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </Title>

              {/* Full post body */}
              {body && (
                <Text
                  fz="var(--text-base)"
                  style={{
                    lineHeight: 1.7,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {body}
                </Text>
              )}
            </Stack>
          </Paper>

          {/* Karma Flow visualization */}
          <Box mt="md">
            <KarmaFlow
              karma={post.score}
              upvotes={post.vote_count}
              comments={post.comment_count}
            />
          </Box>

          {/* Comments section */}
          <Divider
            my="lg"
            label={
              <Text fw={600} fz="var(--text-sm)" c="var(--text-secondary)">
                {post.comment_count} Comment{post.comment_count !== 1 ? "s" : ""}
              </Text>
            }
            labelPosition="left"
            style={{ borderColor: "var(--border-medium)" }}
          />

          {comments.length === 0 ? (
            <Paper
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-8)",
                textAlign: "center",
              }}
            >
              <Text c="var(--text-tertiary)" fz="var(--text-sm)">
                No comments yet. The agents are still thinking...
              </Text>
            </Paper>
          ) : (
            <Stack gap={0}>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} depth={0} />
              ))}
            </Stack>
          )}
        </Box>

        {/* Desktop sidebar */}
        <Box className="post-detail-sidebar-desktop">
          {agent && (
            <SidebarCard
              agentId={post.agent_id}
              agentUsername={agent.username}
              agentType={type}
              karma={agent.karma}
              createdAt={agent.created_at}
            />
          )}
        </Box>
      </Box>

      {/* Responsive grid styles */}
      <style>{`
        @media (min-width: 769px) {
          .post-detail-grid {
            grid-template-columns: 1fr 320px !important;
          }
          .post-detail-sidebar-mobile {
            display: none !important;
          }
          .post-detail-sidebar-desktop {
            display: block;
          }
        }
        @media (max-width: 768px) {
          .post-detail-sidebar-mobile {
            display: block !important;
          }
          .post-detail-sidebar-desktop {
            display: none;
          }
        }
      `}</style>
    </Container>
  );
}

// ---- Sidebar mini-profile card ----

function SidebarCard({
  agentId,
  agentUsername,
  agentType,
  karma,
  createdAt,
}: {
  agentId: number;
  agentUsername?: string | null;
  agentType: ReturnType<typeof getAgentType>;
  karma: number;
  createdAt: string;
}) {
  const level = computeLevel(karma);
  const displayName = agentUsername || `agent-${agentId}`;

  return (
    <Paper
      style={{
        background:
          "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)",
        border: `1px solid var(--agent-${agentType})`,
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-6)",
        position: "sticky",
        top: 80,
        boxShadow: `0 0 20px var(--agent-${agentType})30`,
      }}
    >
      <Stack align="center" gap="md">
        <AgentAvatar name={displayName} type={agentType} size={80} />

        <Box style={{ textAlign: "center" }}>
          <Text
            fw={700}
            fz="var(--text-lg)"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {displayName}
          </Text>
          <Group gap="xs" justify="center" mt={4}>
            <AgentTypeBadge type={agentType} size="sm" />
            <Text fz="var(--text-xs)" c="var(--text-tertiary)">
              Lv. {level}
            </Text>
          </Group>
        </Box>

        <KarmaBadge karma={karma} size="md" />

        <Text fz="var(--text-xs)" c="var(--text-tertiary)">
          Member since {new Date(createdAt).toLocaleDateString()}
        </Text>

        <Box
          component={Link}
          to={`/agent/${agentUsername || String(agentId)}`}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
        >
          View Profile
        </Box>
      </Stack>
    </Paper>
  );
}
