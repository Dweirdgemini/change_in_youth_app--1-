/**
 * Social Media API Integration Service
 * Handles authentication and API calls to Twitter, TikTok, LinkedIn, and Instagram
 */

import axios, { AxiosInstance } from "axios";

interface SocialMediaCredentials {
  platform: "twitter" | "tiktok" | "linkedin" | "instagram";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface PostMetrics {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  reach: number;
}

class SocialMediaAPIService {
  private twitterClient: AxiosInstance;
  private tiktokClient: AxiosInstance;
  private linkedinClient: AxiosInstance;
  private instagramClient: AxiosInstance;

  constructor() {
    // Twitter API v2
    this.twitterClient = axios.create({
      baseURL: "https://api.twitter.com/2",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TWITTER_API_KEY}`,
      },
    });

    // TikTok API
    this.tiktokClient = axios.create({
      baseURL: "https://open.tiktokapis.com/v1",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TIKTOK_API_KEY}`,
      },
    });

    // LinkedIn API
    this.linkedinClient = axios.create({
      baseURL: "https://api.linkedin.com/v2",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINKEDIN_API_KEY}`,
      },
    });

    // Instagram Graph API
    this.instagramClient = axios.create({
      baseURL: "https://graph.instagram.com/v18.0",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get metrics for a Twitter post
   */
  async getTwitterPostMetrics(tweetId: string): Promise<PostMetrics> {
    try {
      const response = await this.twitterClient.get(`/tweets/${tweetId}`, {
        params: {
          "tweet.fields": "public_metrics",
        },
      });

      const metrics = response.data.data.public_metrics;
      return {
        likes: metrics.like_count || 0,
        shares: metrics.retweet_count || 0,
        comments: metrics.reply_count || 0,
        views: metrics.impression_count || 0,
        reach: (metrics.impression_count || 0) + (metrics.like_count || 0),
      };
    } catch (error) {
      console.error("Failed to fetch Twitter metrics:", error);
      return { likes: 0, shares: 0, comments: 0, views: 0, reach: 0 };
    }
  }

  /**
   * Get metrics for a TikTok video
   */
  async getTikTokVideoMetrics(videoId: string): Promise<PostMetrics> {
    try {
      const response = await this.tiktokClient.get(
        `/video/query`,
        {
          params: {
            filters: JSON.stringify({
              video_ids: [videoId],
            }),
            fields: ["like_count", "comment_count", "share_count", "view_count"],
          },
        }
      );

      const video = response.data.data.videos[0];
      return {
        likes: video.like_count || 0,
        shares: video.share_count || 0,
        comments: video.comment_count || 0,
        views: video.view_count || 0,
        reach: (video.view_count || 0) + (video.like_count || 0),
      };
    } catch (error) {
      console.error("Failed to fetch TikTok metrics:", error);
      return { likes: 0, shares: 0, comments: 0, views: 0, reach: 0 };
    }
  }

  /**
   * Get metrics for a LinkedIn post
   */
  async getLinkedInPostMetrics(postId: string): Promise<PostMetrics> {
    try {
      const response = await this.linkedinClient.get(`/posts/${postId}`, {
        params: {
          fields: ["likesSummary", "commentsSummary", "sharesSummary"],
        },
      });

      const data = response.data;
      return {
        likes: data.likesSummary?.totalLikes || 0,
        shares: data.sharesSummary?.totalShares || 0,
        comments: data.commentsSummary?.totalComments || 0,
        views: 0, // LinkedIn doesn't expose view count directly
        reach: (data.likesSummary?.totalLikes || 0) + (data.commentsSummary?.totalComments || 0),
      };
    } catch (error) {
      console.error("Failed to fetch LinkedIn metrics:", error);
      return { likes: 0, shares: 0, comments: 0, views: 0, reach: 0 };
    }
  }

  /**
   * Get metrics for an Instagram post
   */
  async getInstagramPostMetrics(
    postId: string,
    accessToken: string
  ): Promise<PostMetrics> {
    try {
      const response = await this.instagramClient.get(`/${postId}`, {
        params: {
          fields: "like_count,comments_count,media_product_type",
          access_token: accessToken,
        },
      });

      const data = response.data;
      return {
        likes: data.like_count || 0,
        shares: 0, // Instagram doesn't expose share count
        comments: data.comments_count || 0,
        views: 0, // Views not directly available
        reach: (data.like_count || 0) + (data.comments_count || 0),
      };
    } catch (error) {
      console.error("Failed to fetch Instagram metrics:", error);
      return { likes: 0, shares: 0, comments: 0, views: 0, reach: 0 };
    }
  }

  /**
   * Get metrics from all platforms for a post
   */
  async getAllPlatformMetrics(
    platforms: string[],
    postIds: Record<string, string>,
    accessTokens?: Record<string, string>
  ): Promise<Record<string, PostMetrics>> {
    const results: Record<string, PostMetrics> = {};

    for (const platform of platforms) {
      const postId = postIds[platform];
      if (!postId) continue;

      try {
        switch (platform) {
          case "twitter":
            results[platform] = await this.getTwitterPostMetrics(postId);
            break;
          case "tiktok":
            results[platform] = await this.getTikTokVideoMetrics(postId);
            break;
          case "linkedin":
            results[platform] = await this.getLinkedInPostMetrics(postId);
            break;
          case "instagram":
            const token = accessTokens?.instagram || process.env.INSTAGRAM_ACCESS_TOKEN;
            if (token) {
              results[platform] = await this.getInstagramPostMetrics(postId, token);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to fetch ${platform} metrics:`, error);
        results[platform] = { likes: 0, shares: 0, comments: 0, views: 0, reach: 0 };
      }
    }

    return results;
  }

  /**
   * Aggregate metrics from all platforms
   */
  aggregateMetrics(
    platformMetrics: Record<string, PostMetrics>
  ): PostMetrics {
    return {
      likes: Object.values(platformMetrics).reduce((sum, m) => sum + m.likes, 0),
      shares: Object.values(platformMetrics).reduce((sum, m) => sum + m.shares, 0),
      comments: Object.values(platformMetrics).reduce((sum, m) => sum + m.comments, 0),
      views: Object.values(platformMetrics).reduce((sum, m) => sum + m.views, 0),
      reach: Object.values(platformMetrics).reduce((sum, m) => sum + m.reach, 0),
    };
  }
}

export const socialMediaAPI = new SocialMediaAPIService();
