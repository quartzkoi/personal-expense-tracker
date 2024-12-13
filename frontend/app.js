import { 
    CognitoIdentityProviderClient, 
    SignUpCommand, 
    InitiateAuthCommand, 
    GlobalSignOutCommand 
    } from "@aws-sdk/client-cognito-identity-provider";
  
  class ExpenseTracker {
      constructor() {
          // Configure AWS Cognito client
          this.cognitoClient = new CognitoIdentityProviderClient({ 
              region: 'YOUR_AWS_REGION' 
          });
  
          // Cognito-specific configuration
          this.userPoolId = 'YOUR_COGNITO_USER_POOL_ID';
          this.clientId = 'YOUR_COGNITO_APP_CLIENT_ID';
  
          this.initializeEventListeners();
          this.checkAuthStatus();
      }
  
      initializeEventListeners() {
          document.getElementById('expense-form').addEventListener('submit', this.addExpense.bind(this));
          document.getElementById('sign-up-form').addEventListener('submit', this.signUp.bind(this));
          document.getElementById('sign-in-form').addEventListener('submit', this.signIn.bind(this));
          document.getElementById('sign-out-btn').addEventListener('click', this.signOut.bind(this));
      }
  
      async checkAuthStatus() {
          const accessToken = localStorage.getItem('accessToken');
          const idToken = localStorage.getItem('idToken');
          
          if (accessToken && idToken) {
              try {
                  // Validate the tokens
                  await this.validateTokens(accessToken);
                  this.toggleAuthUI(true);
              } catch (error) {
                  console.error('Token validation failed:', error);
                  this.signOut();
              }
          }
      }

    toggleAuthUI(isAuthenticated) {
        document.getElementById('auth-section').style.display = isAuthenticated ? 'none' : 'block';
        document.getElementById('expense-section').style.display = isAuthenticated ? 'block' : 'none';
    }

    async validateTokens(accessToken) {
        try {
            // You would typically call your backend to validate the token
            // This is a placeholder for token validation logic
            const response = await fetch('/validate-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }
        } catch (error) {
            throw error;
        }
    }

    async signUp(event) {
        event.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const email = document.getElementById('signup-email').value;

        try {
            const signUpCommand = new SignUpCommand({
                ClientId: this.clientId,
                Username: username,
                Password: password,
                UserAttributes: [
                    { Name: 'email', Value: email },
                    { Name: 'preferred_username', Value: username }
                ]
            });

            const response = await this.cognitoClient.send(signUpCommand);
            
            alert('User created successfully. Please check your email to confirm your account.');
        } catch (error) {
            console.error('Signup error', error);
            alert(`Signup failed: ${error.message}`);
        }
    }

    async signIn(event) {
        event.preventDefault();
        const username = document.getElementById('signin-username').value;
        const password = document.getElementById('signin-password').value;

        try {
            const authCommand = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: this.clientId,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password
                }
            });

            const authResponse = await this.cognitoClient.send(authCommand);
            
            // Store tokens securely
            localStorage.setItem('accessToken', authResponse.AuthenticationResult.AccessToken);
            localStorage.setItem('idToken', authResponse.AuthenticationResult.IdToken);
            localStorage.setItem('refreshToken', authResponse.AuthenticationResult.RefreshToken);

            // Toggle UI and fetch expenses
            this.toggleAuthUI(true);
            await this.fetchExpenses(authResponse.AuthenticationResult.AccessToken);
        } catch (error) {
            console.error('Login error', error);
            alert(`Login failed: ${error.message}`);
        }
    }

    async signOut() {
        const accessToken = localStorage.getItem('accessToken');

        try {
            // Perform global sign out in Cognito
            const signOutCommand = new GlobalSignOutCommand({
                AccessToken: accessToken
            });

            await this.cognitoClient.send(signOutCommand);

            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');
            localStorage.removeItem('refreshToken');

            // Toggle UI
            this.toggleAuthUI(false);
        } catch (error) {
            console.error('Signout error', error);
        }
    }


    async fetchExpenses(token) {
        try {
            const response = await fetch(`${API_ENDPOINT}/expenses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch expenses');
            }

            const expenses = await response.json();
            this.renderExpenses(expenses);
        } catch (error) {
            console.error('Fetch expenses error', error);
        }
    }

    renderExpenses(expenses) {
        const expensesList = document.getElementById('expenses-list');
        expensesList.innerHTML = '';

        expenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.classList.add('expense-item');
            expenseItem.innerHTML = `
                <span>${expense.category} - $${expense.amount}</span>
                <span>${expense.description}</span>
                <span>${new Date(expense.date).toLocaleDateString()}</span>
                <button onclick="expenseTracker.deleteExpense('${expense.id}')">Delete</button>
            `;
            expensesList.appendChild(expenseItem);
        });
    }

    async deleteExpense(expenseId) {
        const token = localStorage.getItem('userToken');

        try {
            const response = await fetch(`${API_ENDPOINT}/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete expense');
            }

            await this.fetchExpenses(token);
        } catch (error) {
            console.error('Delete expense error', error);
            alert('Failed to delete expense');
        }
    }
}

// Initialize the expense tracker
const expenseTracker = new ExpenseTracker();
window.expenseTracker = expenseTracker;