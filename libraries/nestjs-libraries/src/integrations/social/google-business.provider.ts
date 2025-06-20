import {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { Integration } from '@prisma/client';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import dayjs from 'dayjs';

export class GoogleBusinessProvider extends SocialAbstract implements SocialProvider {
  identifier = 'google-business';
  name = 'Google Business Profile';
  isBetweenSteps = true;
  scopes = [];
  
  async customFields() {
    return [
      {
        key: 'accountId',
        label: 'Google Business Account ID',
        validation: '/^accounts\\/[0-9]+$/',
        type: 'text' as const,
      },
      {
        key: 'locationId', 
        label: 'Location ID',
        validation: '/^locations\\/[0-9]+$/',
        type: 'text' as const,
      },
      {
        key: 'apiKey',
        label: 'Google API Key',
        validation: '/^[A-Za-z0-9_-]+$/',
        type: 'password' as const,
      },
    ];
  }

  async refreshToken(refresh_token: string): Promise<AuthTokenDetails> {
    // For API key based auth, no refresh needed
    return {
      accessToken: refresh_token,
      refreshToken: refresh_token,
      id: '',
      name: '',
      picture: '',
      username: '',
    };
  }

  async generateAuthUrl() {
    const state = makeId(6);
    // For custom fields, we don't generate an OAuth URL
    return {
      url: '',
      codeVerifier: makeId(10),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }) {
    // Decode the custom fields from the code parameter
    const credentials = JSON.parse(Buffer.from(params.code, 'base64').toString());
    
    if (!credentials.accountId || !credentials.locationId || !credentials.apiKey) {
      return 'Missing required Google Business credentials';
    }
    
    try {
      // Test the API key by making a simple request
      const testResponse = await this.fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${credentials.accountId}/${credentials.locationId}?key=${credentials.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!testResponse.ok) {
        const error = await testResponse.json();
        return error.error?.message || 'Invalid Google Business credentials';
      }

      const locationData = await testResponse.json();

      return {
        id: credentials.locationId,
        name: locationData.title || 'Google Business Profile',
        accessToken: credentials.apiKey,
        refreshToken: credentials.apiKey,
        expiresIn: dayjs().add(100, 'years').unix() - dayjs().unix(),
        picture: '',
        username: credentials.accountId,
      };
    } catch (error: any) {
      return error?.message || 'Failed to validate Google Business credentials';
    }
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    const results: PostResponse[] = [];
    
    // Get the custom details
    const customDetails = JSON.parse(
      AuthService.fixedDecryption(integration.customInstanceDetails!)
    );

    for (const post of postDetails) {
      try {
        // Create a local post
        const postData = {
          languageCode: 'en-US',
          summary: post.message,
          ...(post.settings?.callToAction && {
            callToAction: {
              actionType: post.settings.callToAction.actionType,
              url: post.settings.callToAction.url,
            },
          }),
          ...(post.media?.length && {
            media: post.media.map(m => ({
              mediaFormat: m.type === 'image' ? 'PHOTO' : 'VIDEO',
              sourceUrl: m.url,
            })),
          }),
        };

        const postResponse = await this.fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${customDetails.accountId}/${customDetails.locationId}/localPosts?key=${accessToken}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
          }
        );

        const postResult = await postResponse.json();

        if (!postResponse.ok) {
          throw new Error(postResult.error?.message || 'Failed to create post');
        }

        results.push({
          id: post.id,
          postId: postResult.name || 'success',
          releaseURL: postResult.searchUrl || '',
          status: 'success',
        });
      } catch (error: any) {
        results.push({
          id: post.id,
          postId: 'error',
          releaseURL: '',
          status: 'error',
        });
      }
    }

    return results;
  }
}