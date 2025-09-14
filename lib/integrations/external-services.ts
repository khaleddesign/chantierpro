import { BaseIntegration, IntegrationConfig, IntegrationResponse } from './base';
import { DataEncryption } from '@/lib/security';

/**
 * Intégration avec les services de géolocalisation et cartographie
 */
export class MappingIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      baseUrl: 'https://api.mapbox.com',
      rateLimitRequests: 1000,
      rateLimitWindow: 3600,
      timeout: 10000,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'API key is required for mapping integration'
      };
    }
    return await this.makeRequest('GET', '/geocoding/v5/mapbox.places/test.json', undefined, {
      headers: { 'access_token': this.config.apiKey }
    });
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    // Pas de sync nécessaire pour ce service
    return { success: true };
  }

  /**
   * Géocodage d'une adresse
   */
  async geocodeAddress(address: string): Promise<IntegrationResponse<{
    coordinates: [number, number];
    formattedAddress: string;
    confidence: number;
  }>> {
    try {
      const encodedAddress = encodeURIComponent(address);
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API key is required for geocoding'
        };
      }
      const response = await this.makeRequest('GET', 
        `/geocoding/v5/mapbox.places/${encodedAddress}.json?country=FR&language=fr&access_token=${this.config.apiKey}`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Adresse non trouvée'
        };
      }

      const data = response.data as { features?: Array<{ center: [number, number]; place_name: string; relevance: number }> };
      if (!data.features?.length) {
        return {
          success: false,
          error: 'Adresse non trouvée'
        };
      }

      const feature = data.features[0];
      
      return {
        success: true,
        data: {
          coordinates: feature.center,
          formattedAddress: feature.place_name,
          confidence: feature.relevance
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur géocodage'
      };
    }
  }

  /**
   * Calcul d'itinéraire entre deux points
   */
  async calculateRoute(
    origin: [number, number], 
    destination: [number, number]
  ): Promise<IntegrationResponse<{
    distance: number;
    duration: number;
    geometry: any;
  }>> {
    try {
      const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API key is required for route calculation'
        };
      }
      const response = await this.makeRequest('GET',
        `/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${this.config.apiKey}`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: 'Itinéraire non calculable'
        };
      }

      const data = response.data as { routes?: Array<{ distance: number; duration: number; geometry: any }> };
      if (!data.routes?.length) {
        return {
          success: false,
          error: 'Itinéraire non calculable'
        };
      }

      const route = data.routes[0];

      return {
        success: true,
        data: {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur calcul itinéraire'
      };
    }
  }
}

/**
 * Intégration avec les services météorologiques
 */
export class WeatherIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      rateLimitRequests: 1000,
      rateLimitWindow: 3600,
      timeout: 5000,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'API key is required for weather integration'
      };
    }
    return await this.makeRequest('GET', '/weather?q=Paris,FR&appid=' + this.config.apiKey);
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    // Sync des prévisions pour tous les chantiers actifs
    return { success: true };
  }

  /**
   * Récupération de la météo actuelle
   */
  async getCurrentWeather(lat: number, lon: number): Promise<IntegrationResponse<{
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    visibility: number;
    workingConditions: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DANGEROUS';
  }>> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API key is required for weather data'
        };
      }
      const response = await this.makeRequest('GET',
        `/weather?lat=${lat}&lon=${lon}&appid=${this.config.apiKey}&units=metric&lang=fr`
      );

      if (!response.success) {
        return {
          success: false,
          error: 'Impossible de récupérer la météo'
        };
      }

      const data = response.data as {
        main: { temp: number; humidity: number };
        weather: Array<{ description: string }>;
        wind?: { speed: number };
        rain?: { '1h': number };
        snow?: { '1h': number };
        visibility?: number;
      };
      const workingConditions = this.assessWorkingConditions(data) as 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DANGEROUS';

      return {
        success: true,
        data: {
          temperature: data.main.temp,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind?.speed || 0,
          precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
          visibility: data.visibility || 10000,
          workingConditions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur météo'
      };
    }
  }

  /**
   * Prévisions météo sur 5 jours
   */
  async getWeatherForecast(lat: number, lon: number): Promise<IntegrationResponse<Array<{
    date: string;
    temperature: { min: number; max: number };
    description: string;
    precipitation: number;
    workingConditions: string;
  }>>> {
    try {
      if (!this.config.apiKey) {
        return {
          success: false,
          error: 'API key is required for weather forecast'
        };
      }
      const response = await this.makeRequest('GET',
        `/forecast?lat=${lat}&lon=${lon}&appid=${this.config.apiKey}&units=metric&lang=fr`
      );

      if (!response.success) {
        return {
          success: false,
          error: 'Impossible de récupérer les prévisions'
        };
      }

      const data = response.data as { list: any[] };
      // Regroupement par jour
      const dailyData = this.groupForecastByDay(data.list);

      return {
        success: true,
        data: dailyData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur prévisions'
      };
    }
  }

  private assessWorkingConditions(weatherData: any): string {
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind?.speed || 0;
    const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;
    const visibility = weatherData.visibility || 10000;

    // Conditions dangereuses
    if (temp < -5 || temp > 40 || windSpeed > 15 || precipitation > 10 || visibility < 1000) {
      return 'DANGEROUS';
    }

    // Mauvaises conditions
    if (temp < 0 || temp > 35 || windSpeed > 10 || precipitation > 5 || visibility < 5000) {
      return 'POOR';
    }

    // Conditions moyennes
    if (temp < 5 || temp > 30 || windSpeed > 7 || precipitation > 2) {
      return 'FAIR';
    }

    // Bonnes conditions
    if (temp >= 10 && temp <= 25 && windSpeed <= 5 && precipitation <= 1) {
      return 'EXCELLENT';
    }

    return 'GOOD';
  }

  private groupForecastByDay(forecastList: any[]): any[] {
    const grouped: { [key: string]: any[] } = {};
    
    forecastList.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });

    return Object.entries(grouped).map(([date, items]) => {
      const temps = items.map(item => item.main.temp);
      const precipitations = items.map(item => 
        (item.rain?.['3h'] || 0) + (item.snow?.['3h'] || 0)
      );

      return {
        date,
        temperature: {
          min: Math.min(...temps),
          max: Math.max(...temps)
        },
        description: items[0].weather[0].description,
        precipitation: Math.max(...precipitations),
        workingConditions: this.assessWorkingConditions(items[0])
      };
    }).slice(0, 5);
  }
}

/**
 * Intégration avec les services de communication (SMS, Email)
 */
export class CommunicationIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      baseUrl: 'https://api.sendinblue.com/v3',
      rateLimitRequests: 300,
      rateLimitWindow: 3600,
      timeout: 10000,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    return await this.makeRequest('GET', '/account');
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    // Sync des contacts et listes
    return { success: true };
  }

  /**
   * Envoi d'email transactionnel
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    templateId?: number;
    templateParams?: Record<string, any>;
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      const payload = {
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        ...(params.templateId && {
          templateId: params.templateId,
          params: params.templateParams
        })
      };

      const response = await this.makeRequest('POST', '/smtp/email', payload);

      return {
        success: response.success,
        data: response.data as { messageId: string } | undefined,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur envoi email'
      };
    }
  }

  /**
   * Envoi de SMS
   */
  async sendSMS(params: {
    to: string;
    content: string;
    sender: string;
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      const payload = {
        type: 'transactional',
        unicodeEnabled: true,
        recipient: params.to,
        content: params.content,
        sender: params.sender
      };

      const response = await this.makeRequest('POST', '/transactionalSMS/sms', payload);

      return {
        success: response.success,
        data: response.data as { messageId: string } | undefined,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur envoi SMS'
      };
    }
  }

  /**
   * Synchronisation des contacts CRM
   */
  async syncContacts(contacts: Array<{
    email: string;
    nom?: string;
    telephone?: string;
    attributs?: Record<string, any>;
  }>): Promise<IntegrationResponse<{ imported: number; updated: number }>> {
    try {
      const payload = {
        contacts: contacts.map(contact => ({
          email: contact.email,
          attributes: {
            NOM: contact.nom || '',
            SMS: contact.telephone || '',
            ...contact.attributs
          }
        }))
      };

      const response = await this.makeRequest('POST', '/contacts/import', payload);

      return {
        success: response.success,
        data: response.data as { imported: number; updated: number } | undefined,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur sync contacts'
      };
    }
  }
}

/**
 * Intégration avec les services de stockage cloud
 */
export class CloudStorageIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      baseUrl: 'https://api.dropboxapi.com/2',
      rateLimitRequests: 1200,
      rateLimitWindow: 3600,
      timeout: 30000,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    return await this.makeRequest('POST', '/users/get_current_account');
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    // Sync des dossiers et fichiers de chantiers
    return { success: true };
  }

  /**
   * Upload d'un fichier
   */
  async uploadFile(
    filePath: string, 
    fileBuffer: Buffer, 
    options?: { overwrite?: boolean }
  ): Promise<IntegrationResponse<{
    id: string;
    name: string;
    size: number;
    url: string;
  }>> {
    try {
      const payload = {
        path: filePath,
        mode: options?.overwrite ? 'overwrite' : 'add',
        autorename: true
      };

      const response = await this.makeRequest('POST', '/files/upload', fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify(payload)
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Upload failed'
        };
      }

      const uploadData = response.data as {
        id: string;
        name: string;
        size: number;
        path_display: string;
      };

      // Créer un lien de partage
      const shareResponse = await this.makeRequest('POST', '/sharing/create_shared_link_with_settings', {
        path: uploadData.path_display
      });

      const shareData = shareResponse.data as { url: string } | undefined;

      return {
        success: true,
        data: {
          id: uploadData.id,
          name: uploadData.name,
          size: uploadData.size,
          url: shareResponse.success && shareData ? shareData.url : ''
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur upload fichier'
      };
    }
  }

  /**
   * Création d'un dossier de chantier
   */
  async createChantierFolder(chantierNom: string, clientNom: string): Promise<IntegrationResponse<{
    path: string;
    url: string;
  }>> {
    try {
      const folderPath = `/Chantiers/${clientNom}/${chantierNom}`;
      
      // Créer la structure de dossiers
      const folders = [
        folderPath,
        `${folderPath}/Plans`,
        `${folderPath}/Photos`,
        `${folderPath}/Documents`,
        `${folderPath}/Factures`
      ];

      for (const folder of folders) {
        await this.makeRequest('POST', '/files/create_folder_v2', {
          path: folder
        });
      }

      // Créer un lien de partage pour le dossier principal
      const shareResponse = await this.makeRequest('POST', '/sharing/create_shared_link_with_settings', {
        path: folderPath,
        settings: {
          requested_visibility: 'team_only',
          audience: 'team',
          access: 'editor'
        }
      });

      const shareData = shareResponse.data as { url: string } | undefined;

      return {
        success: true,
        data: {
          path: folderPath,
          url: shareResponse.success && shareData ? shareData.url : ''
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur création dossier'
      };
    }
  }
}

/**
 * Intégration avec les services de signature électronique
 */
export class ESignatureIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      baseUrl: 'https://api.docusign.net/restapi/v2.1',
      rateLimitRequests: 1000,
      rateLimitWindow: 3600,
      timeout: 20000,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    return await this.makeRequest('GET', '/accounts');
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    return { success: true };
  }

  /**
   * Envoi d'un document pour signature
   */
  async sendForSignature(params: {
    documentName: string;
    documentBuffer: Buffer;
    signerEmail: string;
    signerName: string;
    message?: string;
  }): Promise<IntegrationResponse<{
    envelopeId: string;
    signingUrl: string;
    status: string;
  }>> {
    try {
      // Encode document en base64
      const documentBase64 = params.documentBuffer.toString('base64');
      
      const envelopeDefinition = {
        emailSubject: `Signature requise: ${params.documentName}`,
        emailBlurb: params.message || 'Veuillez signer ce document',
        documents: [{
          documentBase64,
          name: params.documentName,
          fileExtension: 'pdf',
          documentId: '1'
        }],
        recipients: {
          signers: [{
            email: params.signerEmail,
            name: params.signerName,
            recipientId: '1',
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '100'
              }]
            }
          }]
        },
        status: 'sent'
      };

      const response = await this.makeRequest('POST', 
        `/accounts/${this.config.settings?.accountId}/envelopes`, 
        envelopeDefinition
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to send document for signature'
        };
      }

      const envelopeData = response.data as {
        envelopeId: string;
        status: string;
      };

      // Récupérer l'URL de signature
      const viewResponse = await this.makeRequest('POST',
        `/accounts/${this.config.settings?.accountId}/envelopes/${envelopeData.envelopeId}/views/recipient`,
        {
          returnUrl: `${this.config.settings?.returnUrl}?envelopeId=${envelopeData.envelopeId}`,
          authenticationMethod: 'email',
          email: params.signerEmail,
          userName: params.signerName,
          recipientId: '1'
        }
      );

      const viewData = viewResponse.data as { url: string } | undefined;

      return {
        success: true,
        data: {
          envelopeId: envelopeData.envelopeId,
          signingUrl: viewResponse.success && viewData ? viewData.url : '',
          status: envelopeData.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur envoi signature'
      };
    }
  }
}