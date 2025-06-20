import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';

@Injectable()
export class OAuthValidatorService {
  /**
   * Validates OAuth credentials for different platforms
   */
  async validateCredentials(
    platform: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      switch (platform.toLowerCase()) {
        case 'youtube':
          return await this.validateYouTubeCredentials(clientId, clientSecret);
        case 'facebook':
          return await this.validateFacebookCredentials(clientId, clientSecret);
        case 'twitter':
          return await this.validateTwitterCredentials(clientId, clientSecret);
        case 'linkedin':
          return await this.validateLinkedInCredentials(clientId, clientSecret);
        default:
          // For platforms without specific validation, we can't verify
          // but we'll at least check if credentials are provided
          if (clientId && clientSecret) {
            return { isValid: true };
          }
          return { isValid: false, error: 'Missing credentials' };
      }
    } catch (error: any) {
      return {
        isValid: false,
        error: error?.message || 'Failed to validate credentials',
      };
    }
  }

  /**
   * Validates YouTube OAuth credentials by checking with Google's OAuth2 service
   */
  private async validateYouTubeCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Basic format validation
      if (!clientId || !clientSecret) {
        return { isValid: false, error: 'Missing credentials' };
      }

      // Check if clientId follows Google OAuth2 format (ends with .apps.googleusercontent.com)
      if (!clientId.endsWith('.apps.googleusercontent.com')) {
        return { 
          isValid: false, 
          error: 'Invalid client ID format. YouTube OAuth client IDs should end with .apps.googleusercontent.com' 
        };
      }

      // Attempt to get a token using client credentials flow
      // This will fail if the credentials are invalid
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const response = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: 'invalid_token' // We use an invalid token to test credentials
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true // Don't throw on any status
      });

      // Check the response
      if (response.status === 400 && response.data?.error === 'invalid_grant') {
        // This means credentials are valid but refresh token is invalid (expected)
        return { isValid: true };
      } else if (response.status === 400 && response.data?.error === 'invalid_client') {
        // This means the client credentials are invalid
        return { isValid: false, error: 'Invalid client credentials' };
      } else if (response.status === 401) {
        // Unauthorized - invalid credentials
        return { isValid: false, error: 'Invalid OAuth credentials' };
      }

      // For any other response, consider it invalid
      return { 
        isValid: false, 
        error: response.data?.error_description || 'Unable to validate credentials' 
      };
    } catch (error: any) {
      // Network or other errors
      return {
        isValid: false,
        error: error?.message || 'Failed to validate YouTube credentials',
      };
    }
  }

  /**
   * Validates Facebook OAuth credentials
   */
  private async validateFacebookCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Facebook Graph API endpoint to validate app credentials
      const response = await axios.get(
        `https://graph.facebook.com/oauth/access_token`,
        {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          },
        }
      );

      if (response.data && response.data.access_token) {
        return { isValid: true };
      }

      return { isValid: false, error: 'Failed to obtain access token' };
    } catch (error: any) {
      if (error?.response?.data?.error?.message) {
        return {
          isValid: false,
          error: error.response.data.error.message,
        };
      }
      return {
        isValid: false,
        error: 'Invalid Facebook OAuth credentials',
      };
    }
  }

  /**
   * Validates Twitter OAuth credentials
   */
  private async validateTwitterCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Twitter OAuth 2.0 endpoint
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64'
      );

      const response = await axios.post(
        'https://api.twitter.com/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data && response.data.access_token) {
        return { isValid: true };
      }

      return { isValid: false, error: 'Failed to obtain bearer token' };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return {
          isValid: false,
          error: 'Invalid Twitter OAuth credentials',
        };
      }
      return {
        isValid: false,
        error: 'Failed to validate Twitter credentials',
      };
    }
  }

  /**
   * Validates LinkedIn OAuth credentials
   */
  private async validateLinkedInCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // LinkedIn doesn't provide a direct validation endpoint
      // We can only verify the format
      if (clientId.length < 10 || clientSecret.length < 10) {
        return {
          isValid: false,
          error: 'Invalid credential format',
        };
      }

      // In production, you'd need to attempt an actual OAuth flow
      // or use LinkedIn's API to validate
      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        error: 'Failed to validate LinkedIn credentials',
      };
    }
  }
}