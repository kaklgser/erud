declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

class GoogleAuthService {
  private clientId = '688195257967-r2n6l9fauav7dv29bkk1jrlqdq4e75m3.apps.googleusercontent.com';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google) {
          try {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: this.handleCredentialResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false
            });
            this.isInitialized = true;
            resolve();
          } catch (error) {
            console.error('Google initialization error:', error);
            reject(new Error('Failed to initialize Google Identity Services'));
          }
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };

      document.head.appendChild(script);
    });
  }

  private handleCredentialResponse(response: any) {
    if (this.pendingPromise) {
      try {
        const payload = this.parseJwt(response.credential);
        const user: GoogleUser = {
          id: payload.sub,
          email: payload.email,
          name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
          picture: payload.picture || '',
          given_name: payload.given_name || '',
          family_name: payload.family_name || '',
        };
        this.pendingPromise.resolve(user);
      } catch (error) {
        console.error('Error parsing credential response:', error);
        this.pendingPromise.reject(error);
      }
      this.pendingPromise = null;
    }
  }

  private parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Failed to parse JWT token');
    }
  }

  private pendingPromise: { resolve: (user: GoogleUser) => void; reject: (error: any) => void } | null = null;

  async signInWithGoogle(): Promise<GoogleUser> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.pendingPromise = { resolve, reject };

      try {
        // Try the prompt first
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          
          if (notification.isNotDisplayed()) {
            console.log('Google prompt not displayed, reason:', notification.getNotDisplayedReason());
            
            const reason = notification.getNotDisplayedReason();
            let errorMessage = 'Google sign-in is currently unavailable. ';
            
            if (reason === 'origin_mismatch') {
              errorMessage = 'Google OAuth configuration error: This domain is not authorized.\n\n' +
                'To fix this:\n' +
                '1. Go to Google Cloud Console\n' +
                '2. Navigate to APIs & Services → Credentials\n' +
                '3. Edit the OAuth 2.0 Client ID\n' +
                '4. Add https://localhost:5173 to "Authorized JavaScript origins"\n' +
                '5. Add https://localhost:5173 to "Authorized redirect URIs"\n' +
                '6. Save and wait 5-10 minutes\n\n' +
                'For now, please use email/password login.';
            } else if (reason === 'browser_not_supported') {
              errorMessage = 'Your browser doesn\'t support Google sign-in. Please try:\n' +
                '- Using Chrome, Firefox, or Safari\n' +
                '- Enabling third-party cookies\n' +
                '- Disabling ad blockers\n' +
                '- Using email/password login instead';
            } else if (reason === 'invalid_client') {
              errorMessage = 'Google OAuth client configuration is invalid.\n' +
                'Please contact support or use email/password login.';
            } else {
              errorMessage += 'This might be due to:\n' +
                '1. Pop-up blockers\n' +
                '2. Third-party cookies being disabled\n' +
                '3. Browser privacy settings\n' +
                '4. Domain not authorized in Google Cloud Console\n\n' +
                'Please try:\n' +
                '- Allowing pop-ups for this site\n' +
                '- Enabling third-party cookies\n' +
                '- Using a different browser\n' +
                '- Using email/password login instead';
            }
            
            if (this.pendingPromise) {
              this.pendingPromise.reject(new Error(errorMessage));
              this.pendingPromise = null;
            }
          } else if (notification.isSkippedMoment()) {
            console.log('Google prompt skipped');
            if (this.pendingPromise) {
              this.pendingPromise.reject(new Error('Google sign-in was cancelled. Please try again.'));
              this.pendingPromise = null;
            }
          }
        });

        // Set a shorter timeout with better error handling
        const timeoutId = setTimeout(() => {
          if (this.pendingPromise) {
            console.log('Google sign-in timeout reached');
            this.pendingPromise.reject(new Error('Google sign-in timed out after 5 seconds. Please check your internet connection and try again.'));
            this.pendingPromise = null;
          }
        }, 4000); // 4 second timeout

        // Clear timeout if sign-in completes successfully
        const originalResolve = this.pendingPromise.resolve;
        const originalReject = this.pendingPromise.reject;
        
        this.pendingPromise.resolve = (user: GoogleUser) => {
          clearTimeout(timeoutId);
          originalResolve(user);
        };
        
        this.pendingPromise.reject = (error: any) => {
          clearTimeout(timeoutId);
          originalReject(error);
        };
      } catch (error) {
        console.error('Google sign-in error:', error);
        reject(new Error('Failed to initiate Google sign-in. Please try email/password login instead.'));
      }
    });
  }

  async signOut(): Promise<void> {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Error during Google sign out:', error);
      }
    }
  }
}

export const googleAuth = new GoogleAuthService();