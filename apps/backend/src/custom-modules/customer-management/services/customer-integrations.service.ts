import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class CustomerIntegrationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly integrationManager: IntegrationManager,
    private readonly integrationService: IntegrationService
  ) {}

  async generateCustomerOAuthUrl(
    organizationId: string,
    customerId: string,
    provider: string,
    refresh?: string,
    externalUrl?: string
  ) {
    // Verify customer belongs to organization
    const customer = await this.prismaService.customer.findFirst({
      where: {
        id: customerId,
        orgId: organizationId,
      },
      include: {
        platformConfigs: {
          where: {
            platform: provider,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const platformConfig = customer.platformConfigs[0];
    if (!platformConfig || !platformConfig.clientId || !platformConfig.clientSecret) {
      throw new BadRequestException(`No OAuth credentials configured for ${provider}`);
    }

    // Decrypt credentials
    const clientId = this.decryptData(platformConfig.clientId);
    const clientSecret = this.decryptData(platformConfig.clientSecret);

    // Get the provider implementation
    const integrationProvider = this.integrationManager.getSocialIntegration(provider);
    if (!integrationProvider) {
      throw new BadRequestException('Invalid provider');
    }

    try {
      const state = makeId(6);
      const codeVerifier = makeId(10);
      let url: string;

      // Generate OAuth URL with customer credentials based on provider
      switch (provider) {
        case 'facebook':
        case 'instagram':
          url = 'https://www.facebook.com/v20.0/dialog/oauth' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/${provider}/customer-callback`
            )}` +
            `&state=${state}` +
            `&scope=${integrationProvider.scopes.join(',')}`;
          break;

        case 'linkedin':
          url = 'https://www.linkedin.com/oauth/v2/authorization' +
            `?response_type=code` +
            `&client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/linkedin/customer-callback`
            )}` +
            `&state=${state}` +
            `&scope=${integrationProvider.scopes.join(' ')}`;
          break;

        case 'x':
          const challenge = crypto.randomBytes(32).toString('base64url');
          url = 'https://twitter.com/i/oauth2/authorize' +
            `?response_type=code` +
            `&client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/x/customer-callback`
            )}` +
            `&scope=${integrationProvider.scopes.join(' ')}` +
            `&state=${state}` +
            `&code_challenge=${challenge}` +
            `&code_challenge_method=S256`;
          // Store challenge for X/Twitter
          await ioRedis.set(`challenge:${state}`, challenge, 'EX', 300);
          break;

        case 'youtube':
          url = 'https://accounts.google.com/o/oauth2/v2/auth' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/youtube/customer-callback`
            )}` +
            `&response_type=code` +
            `&scope=${integrationProvider.scopes.join(' ')}` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${state}`;
          break;

        case 'tiktok':
          url = 'https://www.tiktok.com/v2/auth/authorize' +
            `?client_key=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/tiktok/customer-callback`
            )}` +
            `&state=${state}` +
            `&response_type=code` +
            `&scope=${integrationProvider.scopes.join(',')}`;
          break;

        case 'pinterest':
          url = 'https://www.pinterest.com/oauth' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/pinterest/customer-callback`
            )}` +
            `&response_type=code` +
            `&scope=${integrationProvider.scopes.join(',')}` +
            `&state=${state}`;
          break;

        case 'reddit':
          url = 'https://www.reddit.com/api/v1/authorize' +
            `?client_id=${clientId}` +
            `&response_type=code` +
            `&state=${state}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/reddit/customer-callback`
            )}` +
            `&duration=permanent` +
            `&scope=${integrationProvider.scopes.join(' ')}`;
          break;

        case 'linkedin-page':
          url = 'https://www.linkedin.com/oauth/v2/authorization' +
            `?response_type=code` +
            `&client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/linkedin-page/customer-callback`
            )}` +
            `&state=${state}` +
            `&scope=${integrationProvider.scopes.join(' ')}`;
          break;

        case 'threads':
          url = 'https://threads.net/oauth/authorize' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/threads/customer-callback`
            )}` +
            `&scope=${integrationProvider.scopes.join(',')}` +
            `&response_type=code` +
            `&state=${state}`;
          break;

        case 'discord':
          url = 'https://discord.com/api/oauth2/authorize' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/discord/customer-callback`
            )}` +
            `&response_type=code` +
            `&scope=${integrationProvider.scopes.join(' ')}` +
            `&state=${state}` +
            `&permissions=0`;
          break;

        case 'slack':
          url = 'https://slack.com/oauth/v2/authorize' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/slack/customer-callback`
            )}` +
            `&scope=${integrationProvider.scopes.join(',')}` +
            `&state=${state}`;
          break;

        case 'dribbble':
          url = 'https://dribbble.com/oauth/authorize' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/dribbble/customer-callback`
            )}` +
            `&scope=${integrationProvider.scopes.join('+')}` +
            `&state=${state}`;
          break;

        case 'mastodon':
          // Mastodon requires instance URL, which should be passed in externalUrl
          if (!externalUrl) {
            throw new BadRequestException('Mastodon instance URL is required');
          }
          url = `${externalUrl}/oauth/authorize` +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/mastodon/customer-callback`
            )}` +
            `&response_type=code` +
            `&scope=${integrationProvider.scopes.join(' ')}` +
            `&state=${state}`;
          break;

        case 'vk':
          const vkCodeVerifier = crypto.randomBytes(32).toString('base64url');
          const vkCodeChallenge = crypto.createHash('sha256').update(vkCodeVerifier).digest('base64url');
          url = 'https://oauth.vk.com/authorize' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/vk/customer-callback`
            )}` +
            `&display=page` +
            `&scope=${integrationProvider.scopes.join(',')}` +
            `&response_type=code` +
            `&v=5.131` +
            `&state=${state}` +
            `&code_challenge=${vkCodeChallenge}` +
            `&code_challenge_method=S256`;
          // Store code verifier for VK
          await ioRedis.set(`vk_verifier:${state}`, vkCodeVerifier, 'EX', 300);
          break;

        default:
          // Check if provider uses custom fields instead of OAuth
          const nonOAuthProviders = ['google-business', 'bluesky', 'telegram', 'nostr', 'lemmy', 'wrapcast'];
          if (nonOAuthProviders.includes(provider)) {
            throw new BadRequestException(`${provider} uses custom authentication, not OAuth`);
          }
          throw new BadRequestException(`OAuth not supported for ${provider} yet`);
      }

      // Store state data in Redis with customer context
      await ioRedis.set(`login:${state}`, codeVerifier, 'EX', 300);
      await ioRedis.set(`customer:${state}`, customerId, 'EX', 300);
      await ioRedis.set(`credentials:${state}`, JSON.stringify({ clientId, clientSecret }), 'EX', 300);
      
      if (refresh) {
        await ioRedis.set(`refresh:${state}`, refresh, 'EX', 300);
      }

      if (integrationProvider.externalUrl && externalUrl) {
        await ioRedis.set(`external:${state}`, externalUrl, 'EX', 300);
      }

      return { url, state };
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      throw new BadRequestException('Failed to generate OAuth URL');
    }
  }

  async handleOAuthCallback(
    organizationId: string,
    userId: string,
    customerId: string,
    provider: string,
    code: string,
    state: string
  ) {
    // Retrieve state data from Redis
    const codeVerifier = await ioRedis.get(`login:${state}`);
    const storedCustomerId = await ioRedis.get(`customer:${state}`);
    const credentials = await ioRedis.get(`credentials:${state}`);
    
    if (!codeVerifier || !storedCustomerId || storedCustomerId !== customerId) {
      throw new BadRequestException('Invalid or expired state');
    }

    const { clientId, clientSecret } = JSON.parse(credentials || '{}');
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Missing credentials');
    }

    const integrationProvider = this.integrationManager.getSocialIntegration(provider);
    if (!integrationProvider) {
      throw new BadRequestException('Invalid provider');
    }

    try {
      let authResult: any;

      // Handle authentication based on provider
      switch (provider) {
        case 'facebook':
        case 'instagram': {
          // Get access token
          const tokenResponse = await fetch(
            'https://graph.facebook.com/v20.0/oauth/access_token' +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(
              `${process.env.FRONTEND_URL}/integrations/social/${provider}/customer-callback`
            )}` +
            `&client_secret=${clientSecret}` +
            `&code=${code}`
          );
          const tokenData = await tokenResponse.json();

          // Exchange for long-lived token
          const longLivedResponse = await fetch(
            'https://graph.facebook.com/v20.0/oauth/access_token' +
            '?grant_type=fb_exchange_token' +
            `&client_id=${clientId}` +
            `&client_secret=${clientSecret}` +
            `&fb_exchange_token=${tokenData.access_token}`
          );
          const longLivedData = await longLivedResponse.json();

          // Get user info
          const userResponse = await fetch(
            `https://graph.facebook.com/v20.0/me?fields=id,name,picture&access_token=${longLivedData.access_token}`
          );
          const userData = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.name,
            picture: userData.picture?.data?.url || '',
            accessToken: longLivedData.access_token,
            refreshToken: longLivedData.access_token,
            expiresIn: longLivedData.expires_in || 5184000, // 60 days
            username: '',
          };
          break;
        }

        case 'linkedin': {
          // Get access token
          const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/linkedin?customer=${customerId}`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.sub,
            name: userData.name,
            picture: userData.picture || '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 5184000,
            username: '',
          };
          break;
        }

        case 'x': {
          // Get code challenge from Redis
          const challenge = await ioRedis.get(`challenge:${state}`);
          if (!challenge) {
            throw new BadRequestException('Code challenge not found');
          }

          // Get access token
          const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/x?customer=${customerId}`,
              code_verifier: challenge,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const { data: userData } = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.name,
            picture: '', // X doesn't provide picture in basic info
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 7200,
            username: userData.username,
          };

          // Clean up challenge
          await ioRedis.del(`challenge:${state}`);
          break;
        }

        case 'youtube': {
          // Get access token
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/youtube/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.name,
            picture: userData.picture || '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 3600,
            username: '',
          };
          break;
        }

        case 'tiktok': {
          // Get access token
          const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_key: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/tiktok/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const { data: { user: userData } } = await userResponse.json();

          authResult = {
            id: userData.open_id,
            name: userData.display_name,
            picture: userData.avatar_url || '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 86400,
            username: userData.display_name,
          };
          break;
        }

        case 'pinterest': {
          // Get access token
          const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/pinterest/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.id || userData.username,
            name: userData.username,
            picture: userData.profile_image || '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 2592000, // 30 days
            username: userData.username,
          };
          break;
        }

        case 'linkedin-page': {
          // Same as LinkedIn but with page selection later
          const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/linkedin-page/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.sub,
            name: userData.name,
            picture: userData.picture || '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 5184000,
            username: '',
          };
          break;
        }

        case 'threads': {
          // Get access token
          const tokenResponse = await fetch('https://graph.threads.net/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/threads/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${tokenData.access_token}`);
          const userData = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.username,
            picture: userData.threads_profile_picture_url || '',
            accessToken: tokenData.access_token,
            refreshToken: '',
            expiresIn: tokenData.expires_in || 5184000,
            username: userData.username,
          };
          break;
        }

        case 'discord': {
          // Get access token
          const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/discord/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.username,
            picture: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : '',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || '',
            expiresIn: tokenData.expires_in || 604800,
            username: userData.username,
          };
          break;
        }

        case 'slack': {
          // Get access token
          const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/slack/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          authResult = {
            id: tokenData.team.id,
            name: tokenData.team.name,
            picture: '',
            accessToken: tokenData.access_token,
            refreshToken: '',
            expiresIn: 0, // Slack tokens don't expire
            username: tokenData.incoming_webhook?.channel || '',
          };
          break;
        }

        case 'dribbble': {
          // Get access token
          const tokenResponse = await fetch('https://dribbble.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/dribbble/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch('https://api.dribbble.com/v2/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.id.toString(),
            name: userData.name,
            picture: userData.avatar_url || '',
            accessToken: tokenData.access_token,
            refreshToken: '',
            expiresIn: 0, // Dribbble tokens don't expire
            username: userData.login,
          };
          break;
        }

        case 'mastodon': {
          // Get external URL from Redis
          const externalData = await ioRedis.get(`external:${state}`);
          if (!externalData) {
            throw new BadRequestException('Mastodon instance URL not found');
          }
          const instanceUrl = externalData;

          // Get access token
          const tokenResponse = await fetch(`${instanceUrl}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/mastodon/customer-callback`,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const userData = await userResponse.json();

          authResult = {
            id: userData.id,
            name: userData.display_name || userData.username,
            picture: userData.avatar || '',
            accessToken: tokenData.access_token,
            refreshToken: '',
            expiresIn: 0, // Mastodon tokens don't expire
            username: `@${userData.username}@${new URL(instanceUrl).hostname}`,
          };
          break;
        }

        case 'vk': {
          // Get code verifier from Redis
          const vkCodeVerifier = await ioRedis.get(`vk_verifier:${state}`);
          if (!vkCodeVerifier) {
            throw new BadRequestException('VK code verifier not found');
          }

          // Get access token
          const tokenResponse = await fetch('https://oauth.vk.com/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: `${process.env.FRONTEND_URL}/integrations/social/vk/customer-callback`,
              code_verifier: vkCodeVerifier,
            }),
          });
          const tokenData = await tokenResponse.json();

          // Get user info
          const userResponse = await fetch(`https://api.vk.com/method/users.get?user_ids=${tokenData.user_id}&fields=photo_200&access_token=${tokenData.access_token}&v=5.131`);
          const { response: [userData] } = await userResponse.json();

          authResult = {
            id: tokenData.user_id.toString(),
            name: `${userData.first_name} ${userData.last_name}`,
            picture: userData.photo_200 || '',
            accessToken: tokenData.access_token,
            refreshToken: '',
            expiresIn: tokenData.expires_in || 86400,
            username: '',
          };

          // Clean up VK verifier
          await ioRedis.del(`vk_verifier:${state}`);
          break;
        }

        default:
          // Check if provider uses custom fields instead of OAuth
          const nonOAuthProviders = ['google-business', 'bluesky', 'telegram', 'nostr', 'lemmy', 'wrapcast'];
          if (nonOAuthProviders.includes(provider)) {
            throw new BadRequestException(`${provider} uses custom authentication, not OAuth`);
          }
          throw new BadRequestException(`OAuth not supported for ${provider} yet`);
      }

      if (!authResult || !authResult.id) {
        throw new BadRequestException('Authentication failed');
      }

      // Create or update the integration with customer association
      const integration = await this.integrationService.createOrUpdateIntegration(
        authResult.additionalSettings || '{}',
        !!integrationProvider.oneTimeToken,
        organizationId,
        authResult.name,
        authResult.picture,
        'social',
        authResult.id,
        provider,
        authResult.accessToken,
        authResult.refreshToken,
        authResult.expiresIn,
        authResult.username
      );

      // Link integration to customer
      await this.prismaService.integration.update({
        where: { id: integration.id },
        data: { 
          customerId,
          // Store encrypted credentials for refresh token usage
          additionalSettings: JSON.stringify({
            ...JSON.parse(integration.additionalSettings || '{}'),
            customerOAuth: {
              clientId: this.encryptData(clientId),
              clientSecret: this.encryptData(clientSecret),
            },
          }),
        },
      });

      // Clean up Redis
      await ioRedis.del(`login:${state}`);
      await ioRedis.del(`customer:${state}`);
      await ioRedis.del(`credentials:${state}`);

      return { success: true, integration };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new BadRequestException('Failed to complete OAuth flow');
    }
  }

  async getCustomerIntegrations(organizationId: string, customerId: string) {
    const customer = await this.prismaService.customer.findFirst({
      where: {
        id: customerId,
        orgId: organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const integrations = await this.prismaService.integration.findMany({
      where: {
        organizationId,
        customerId,
        deletedAt: null,
      },
    });

    return integrations.map((integration) => ({
      id: integration.id,
      name: integration.name,
      provider: integration.providerIdentifier,
      picture: integration.picture,
      disabled: integration.disabled,
      type: integration.type,
      createdAt: integration.createdAt,
    }));
  }

  private encryptData(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here', 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptData(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here', 'utf8');
    
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}