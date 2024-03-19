import axios, { AxiosResponse } from 'axios';
import * as domain from "domain";

// TODO move to env variables
const CLIENT_ID = '56q2QCSkRPq1EaezhiGLAqLIzqWNFBTl'
const CLIENT_SECRET = 'gPDYJFkSnAWZpS_PBM-PuufHGOS5HadrNuqASubn95vAotukJtvSOBXaBhzrFtj5'

export class VaultClient {
  private static instance: VaultClient;
  private readonly HCP_CLIENT_ID: string;
  private readonly HCP_CLIENT_SECRET: string;
  private HCP_API_TOKEN: string;
  private secretCache: Record<string, any> = {}; // Simple in-memory cache

  private constructor(clientId: string, clientSecret: string) {
    this.HCP_CLIENT_ID = clientId;
    this.HCP_CLIENT_SECRET = clientSecret;
    this.HCP_API_TOKEN = '';
  }

  public static getInstance(): VaultClient {
    if (!VaultClient.instance) {
      VaultClient.instance = new VaultClient(CLIENT_ID, CLIENT_SECRET);
    }
    return VaultClient.instance;
  }

  private async getAccessToken(): Promise<void> {
    const authUrl = 'https://auth.idp.hashicorp.com/oauth2/token';
    const audience = 'https://api.hashicorp.cloud';

    try {
      const response = await axios.post(authUrl, {
        client_id: this.HCP_CLIENT_ID,
        client_secret: this.HCP_CLIENT_SECRET,
        grant_type: 'client_credentials',
        audience: audience,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.HCP_API_TOKEN = response.data.access_token;
      console.log('Successfully was obtained access token for Vault');
    } catch (error: any) {
      console.error('Error obtaining access token:', error.message);
      throw error;
    }
  }

  public async getCustomerKeys(customerDomain: string) {
    const secrets = await this.getSecrets()

    let key
    let iv
    let found = false
    for (let customerSecret of secrets.secrets) {
      if (customerSecret.name === customerDomain) {
        const obj = JSON.parse(customerSecret.version.value)
        key = obj.key
        iv = obj.iv
        found = true
      }
    }

    if (!found) {
      return undefined
    }

    return { key, iv }
  }

  public async getSecrets(): Promise<any> {
    // Check if the secrets are already cached
    if (this.secretCache && Object.keys(this.secretCache).length > 0) {
      console.log('Fetching secrets from cache:', this.secretCache);
      return this.secretCache;
    }

    // Fetch secrets from the API if not in the cache
    await this.getAccessToken();

    const apiUrl = 'https://api.cloud.hashicorp.com/secrets/2023-06-13/organizations/5cc843f4-59f4-4bb0-b1a2-a786b28a95fb/projects/bb4b9e91-c33b-430a-8132-a73a44a56c15/apps/Secure-VectorDB/open';

    try {
      const response: AxiosResponse = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.HCP_API_TOKEN}`,
        },
      });

      // Cache the fetched secrets for future use
      this.secretCache = response.data;
      console.log('Fetched and cached secrets:', this.secretCache);

      return this.secretCache;
    } catch (error: any) {
      console.error('Error making API request:', error.message);
      throw error;
    }
  }
}
