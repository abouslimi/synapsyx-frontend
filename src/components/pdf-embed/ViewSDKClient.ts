/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

import type { AdobeDCView, ViewerConfig, SaveApiResponse, PDFEvent } from './types';
import { API_ENDPOINTS, buildApiUrl, type UserResponse } from '../../lib/apiConfig';

class ViewSDKClient {
  private readyPromise: Promise<void>;
  private adobeDCView?: AdobeDCView;
  private clientId?: string;
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
    this.readyPromise = new Promise(async (resolve) => {
      // Fetch client ID from server
      try {
        if (window.location.hostname.includes('localhost')) {
          throw new Error('load from localhost');
        }
        const url = buildApiUrl(API_ENDPOINTS.ADOBE_CONFIG);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const config = await response.json();
        this.clientId = config.clientId;
      } catch (error) {
        console.warn('Failed to fetch Adobe client ID, using fallback:', error);
        this.clientId = "8c0cd670273d451cbc9b351b11d22318"; // Fallback to demo client ID
      }

      if (window.AdobeDC) {
        resolve();
      } else {
        /* Wait for Adobe Acrobat Services PDF Embed API to be ready */
        document.addEventListener("adobe_dc_view_sdk.ready", () => {
          resolve();
        });
      }
    });
    this.adobeDCView = undefined;
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  previewFile(divId: string, viewerConfig?: ViewerConfig): Promise<any> {
    const config = {
      /* Pass your registered client id */
      clientId: this.clientId || "8c0cd670273d451cbc9b351b11d22318",
    };
    if (divId) { /* Optional only for Light Box embed mode */
      /* Pass the div id in which PDF should be rendered */
      (config as any).divId = divId;
    }
    /* Initialize the AdobeDC View object */
    this.adobeDCView = new window.AdobeDC.View(config);

    /* Invoke the file preview API on Adobe DC View object */
    const previewFilePromise = this.adobeDCView?.previewFile({
      /* Pass information on how to access the file */
      content: {
        /* Location of file where it is hosted */
        location: {
          url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf",
          /*
          If the file URL requires some additional headers, then it can be passed as follows:-
          headers: [
              {
                  key: "<HEADER_KEY>",
                  value: "<HEADER_VALUE>",
              }
          ]
          */
        },
      },
      /* Pass meta data of file */
      metaData: {
        /* file name */
        fileName: "Bodea Brochure.pdf",
        /* file ID */
        id: "6d07d124-ac85-43b3-a867-36930f502ac6",
      }
    }, viewerConfig);

    return previewFilePromise || Promise.resolve();
  }

  previewFileUsingFilePromise(divId: string, filePromise: Promise<ArrayBuffer>, fileName: string): void {
    /* Initialize the AdobeDC View object */
    this.adobeDCView = new window.AdobeDC.View({
      /* Pass your registered client id */
      clientId: this.clientId || "8c0cd670273d451cbc9b351b11d22318",
      /* Pass the div id in which PDF should be rendered */
      divId,
    });

    /* Invoke the file preview API on Adobe DC View object */
    this.adobeDCView?.previewFile({
      /* Pass information on how to access the file */
      content: {
        /* pass file promise which resolve to arrayBuffer */
        promise: filePromise,
      },
      /* Pass meta data of file */
      metaData: {
        /* file name */
        fileName: fileName
      }
    }, {});
  }

  registerSaveApiHandler(): void {
    /* Define Save API Handler */
    const saveApiHandler = (metaData: any, content: any, options: any): Promise<SaveApiResponse> => {
      console.log(metaData, content, options);
      return new Promise(resolve => {
        /* Dummy implementation of Save API, replace with your business logic */
        setTimeout(() => {
          const response: SaveApiResponse = {
            code: window.AdobeDC.View.Enum.ApiResponseCode.SUCCESS,
            data: {
              metaData: Object.assign(metaData, {updatedAt: new Date().getTime()})
            },
          };
          resolve(response);
        }, 2000);
      });
    };

    this.adobeDCView?.registerCallback(
      window.AdobeDC.View.Enum.CallbackType.SAVE_API,
      saveApiHandler,
      {
        autoSaveFrequency: 60,
        enableFocusPolling: true
      }
    );
  }

  registerEventsHandler(): void {
    /* Register the callback to receive the events */
    this.adobeDCView?.registerCallback(
      /* Type of call back */
      window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
      /* call back function */
      (event: PDFEvent) => {
        console.log('PDF Callback:', event);
        
        // Store page number in localStorage when PAGE_VIEW event is received
        if (event.type === 'PAGE_VIEW' && event.data && event.data.pageNumber && event.data.fileName) {
          const storageKey = `pdf_page_${event.data.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          localStorage.setItem(storageKey, event.data.pageNumber.toString());
          console.log(`Stored page ${event.data.pageNumber} for ${event.data.fileName}`);
        }
      },
      /* options to control the callback execution */
      {
        /* Enable PDF analytics events on user interaction. */
        enablePDFAnalytics: true,
      }
    );
  }

  /**
   * Fetch user profile from the API using the access token
   */
  private async fetchUserProfile(): Promise<UserResponse | null> {
    if (!this.accessToken) {
      console.warn('No access token provided for user profile fetch');
      return null;
    }

    try {
      const url = buildApiUrl(API_ENDPOINTS.USER_PROFILE);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
        return null;
      }

      const userProfile = await response.json();
      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Register the user profile callback for Adobe PDF View SDK
   */
  async registerUserProfileCallback(): Promise<void> {
    if (!this.adobeDCView) {
      console.warn('Adobe DC View not initialized. Call previewFile first.');
      return;
    }

    try {
      // Fetch user profile from API
      const userProfile = await this.fetchUserProfile();
      
      if (!userProfile) {
        console.warn('Could not fetch user profile, skipping profile registration');
        return;
      }

      // Create profile object in the required format
      const profile = {
        userProfile: {
          name: userProfile.first_name && userProfile.last_name 
            ? `${userProfile.first_name} ${userProfile.last_name}` 
            : userProfile.email,
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          email: userProfile.email
        }
      };
      console.log("Pdf user profile", profile);

      // Register the callback
      this.adobeDCView.registerCallback(
        window.AdobeDC.View.Enum.CallbackType.GET_USER_PROFILE_API,
        function() {
          return new Promise((resolve) => {
            resolve({
              code: window.AdobeDC.View.Enum.ApiResponseCode.SUCCESS,
              data: profile
            });
          });
        },
        {}
      );

      console.log('User profile callback registered successfully:', profile);
    } catch (error) {
      console.error('Error registering user profile callback:', error);
    }
  }
}

export default ViewSDKClient;
