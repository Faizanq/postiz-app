import {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { Integration } from '@prisma/client';

export class WebProvider extends SocialAbstract implements SocialProvider {
  identifier = 'web';
  name = 'Web';
  isBetweenSteps = false;
  oneTimeToken = true;
  scopes = [];
  toolTip = 'Publish to your website via webhook';

  async customFields() {
    return [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        validation: '^https?:\\/\\/.+',
        type: 'text' as const,
      },
      {
        key: 'authToken',
        label: 'Authorization Token (optional)',
        validation: '.*',
        type: 'password' as const,
      },
    ];
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    // Web provider doesn't use refresh tokens
    return {
      refreshToken: '',
      expiresIn: 0,
      accessToken: '',
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  async generateAuthUrl() {
    // Web provider doesn't use OAuth
    const state = makeId(6);
    return {
      url: `${process.env.FRONTEND_URL}/integrations/social/web?state=${state}`,
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }) {
    // Web provider uses custom fields for authentication
    const data = JSON.parse(params.code);
    
    if (!data.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    // Validate webhook URL
    try {
      new URL(data.webhookUrl);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    return {
      id: makeId(10),
      name: data.name || 'Web Integration',
      accessToken: JSON.stringify({
        webhookUrl: data.webhookUrl,
        authToken: data.authToken || '',
      }),
      refreshToken: '',
      expiresIn: 0,
      picture: '/icons/platforms/web.png',
      username: new URL(data.webhookUrl).hostname,
    };
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    const results: PostResponse[] = [];
    
    try {
      const config = JSON.parse(accessToken);
      const { webhookUrl, authToken } = config;

      for (const post of postDetails) {
        try {
          // Prepare webhook payload
          const payload = {
            id: post.id,
            message: post.message,
            media: post.media?.map(m => ({
              type: m.type,
              url: m.url,
            })) || [],
            settings: post.settings || {},
            poll: post.poll || null,
            timestamp: new Date().toISOString(),
            integration: {
              id: integration.id,
              name: integration.name,
              profile: integration.profile,
            },
          };

          // Send webhook
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'Postiz/1.0',
          };

          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }

          const response = await this.fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Webhook returned status ${response.status}`);
          }

          const responseData = await response.json().catch(() => ({}));

          results.push({
            id: post.id,
            postId: responseData.id || makeId(10),
            releaseURL: responseData.url || webhookUrl,
            status: 'success',
          });
        } catch (error) {
          results.push({
            id: post.id,
            postId: 'error',
            releaseURL: '',
            status: 'error',
          });
        }
      }
    } catch (error) {
      // If there's an error parsing the access token, fail all posts
      return postDetails.map(post => ({
        id: post.id,
        postId: 'error',
        releaseURL: '',
        status: 'error',
      }));
    }

    return results;
  }
}