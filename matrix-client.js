/**
 * Matrix Client for Math Teaching Room
 * Connects to Matrix room for chat functionality
 */

class MatrixClient {
    constructor(roomId, serverUrl = 'https://matrix.inquiry.institute') {
        this.roomId = roomId;
        this.serverUrl = serverUrl;
        this.client = null;
        this.isConnected = false;
        this.onMessageCallbacks = [];
        this.seenMessageIds = new Set();
    }

    async connect(username, password) {
        try {
            // Initialize Matrix client
            this.client = sdk.createClient({
                baseUrl: this.serverUrl,
            });

            // Login
            const response = await this.client.login('m.login.password', {
                user: username,
                password: password,
            });

            this.client = sdk.createClient({
                baseUrl: this.serverUrl,
                accessToken: response.access_token,
                userId: response.user_id,
            });

            // Start syncing
            this.client.startClient();

            // Wait for sync to complete
            this.client.once('sync', (state) => {
                if (state === 'PREPARED') {
                    this.isConnected = true;
                    this.joinRoom();
                }
            });

            // Listen for messages
            this.client.on('Room.timeline', (event, room) => {
                if (room.roomId === this.roomId && event.getType() === 'm.room.message') {
                    this.handleMessage(event);
                }
            });

            return true;
        } catch (error) {
            console.error('Matrix connection error:', error);
            throw error;
        }
    }

    async connectAsGuest() {
        try {
            // For public rooms, we can use guest access or polling
            // This is a simplified version that polls for messages
            this.isConnected = true;
            this.pollMessages();
            return true;
        } catch (error) {
            console.error('Matrix guest connection error:', error);
            throw error;
        }
    }

    async joinRoom() {
        try {
            await this.client.joinRoom(this.roomId);
            console.log('Joined Matrix room:', this.roomId);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    }

    async pollMessages() {
        // Poll for messages every 2 seconds
        setInterval(async () => {
            try {
                const response = await fetch(
                    `${this.serverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(this.roomId)}/messages?dir=b&limit=50`,
                    {
                        headers: {
                            'Accept': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 403) {
                        console.warn('Room requires authentication');
                        return;
                    }
                    throw new Error(`Failed to fetch messages: ${response.status}`);
                }

                const data = await response.json();
                const events = data.chunk || [];

                for (const event of events) {
                    if (event.type === 'm.room.message' && 
                        event.content?.msgtype === 'm.text' &&
                        !this.seenMessageIds.has(event.event_id)) {
                        this.seenMessageIds.add(event.event_id);
                        this.handleMessage({
                            getType: () => 'm.room.message',
                            getContent: () => event.content,
                            getSender: () => event.sender,
                            getTs: () => event.origin_server_ts,
                            getId: () => event.event_id,
                        });
                    }
                }
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }, 2000);
    }

    handleMessage(event) {
        const message = {
            id: event.getId(),
            sender: event.getSender(),
            content: event.getContent().body || '',
            timestamp: event.getTs() || Date.now(),
        };

        this.onMessageCallbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('Error in message callback:', error);
            }
        });
    }

    async sendMessage(content) {
        if (!this.isConnected) {
            throw new Error('Not connected to Matrix');
        }

        try {
            if (this.client) {
                // Use Matrix SDK
                await this.client.sendTextMessage(this.roomId, content);
            } else {
                // Fallback: use API directly (requires auth token)
                throw new Error('Direct API sending not implemented - use Matrix SDK');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    onMessage(callback) {
        this.onMessageCallbacks.push(callback);
        return () => {
            const index = this.onMessageCallbacks.indexOf(callback);
            if (index > -1) {
                this.onMessageCallbacks.splice(index, 1);
            }
        };
    }

    disconnect() {
        if (this.client) {
            this.client.stopClient();
        }
        this.isConnected = false;
        this.onMessageCallbacks = [];
    }
}
