import SQLite from 'react-native-sqlite-storage';
import { Chat, Message } from '../store/chatStore';

SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabase({
        name: 'localgem.db',
        location: 'default',
      });
      await this.createTables();
      console.log('Database initialized');
    } catch (error) {
      console.error('Database init error:', error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        thinking TEXT,
        imagePath TEXT,
        timestamp INTEGER NOT NULL,
        statsJson TEXT,
        FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
      );
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
    `);

    await this.db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    `);
  }

  async saveChat(chat: Chat) {
    if (!this.db) {
      console.log('DatabaseService: DB not initialized, cannot save chat');
      return;
    }

    try {
      await this.db.executeSql(
        'INSERT OR REPLACE INTO chats (id, title, createdAt) VALUES (?, ?, ?)',
        [chat.id, chat.title, chat.createdAt]
      );
      console.log(`DatabaseService: Saved chat ${chat.id} with title "${chat.title}"`);
    } catch (error) {
      console.error('DatabaseService: Failed to save chat:', error);
    }
  }

  async saveMessage(chatId: string, message: Message) {
    if (!this.db) {
      console.log('DatabaseService: DB not initialized, cannot save message');
      return;
    }

    try {
      const statsJson = message.stats ? JSON.stringify(message.stats) : null;

      await this.db.executeSql(
        `INSERT OR REPLACE INTO messages 
         (id, chatId, role, content, thinking, imagePath, timestamp, statsJson) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          chatId,
          message.role,
          message.content,
          message.thinking || null,
          message.image || null,
          message.timestamp,
          statsJson,
        ]
      );
      console.log(`DatabaseService: Saved message ${message.id} to chat ${chatId}`);
    } catch (error) {
      console.error('DatabaseService: Failed to save message:', error);
    }
  }

  async loadChats(): Promise<Chat[]> {
    if (!this.db) {
      console.log('DatabaseService: DB not initialized');
      return [];
    }

    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM chats ORDER BY createdAt DESC'
      );

      const chats: Chat[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        chats.push({
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          messages: [],
        });
      }

      console.log(`DatabaseService: Loaded ${chats.length} chats`);
      return chats;
    } catch (error) {
      console.error('DatabaseService: Failed to load chats:', error);
      return [];
    }
  }

  async loadMessages(chatId: string, limit: number = 30): Promise<Message[]> {
    if (!this.db) return [];

    const [result] = await this.db.executeSql(
      `SELECT * FROM messages 
       WHERE chatId = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [chatId, limit]
    );

    const messages: Message[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      messages.push({
        id: row.id,
        role: row.role,
        content: row.content,
        thinking: row.thinking,
        image: row.imagePath,
        timestamp: row.timestamp,
        stats: row.statsJson ? JSON.parse(row.statsJson) : undefined,
      });
    }

    return messages.reverse(); // Возвращаем в хронологическом порядке
  }

  async deleteChat(chatId: string) {
    if (!this.db) return;

    await this.db.executeSql('DELETE FROM messages WHERE chatId = ?', [chatId]);
    await this.db.executeSql('DELETE FROM chats WHERE id = ?', [chatId]);
  }

  async updateChatTitle(chatId: string, title: string) {
    if (!this.db) return;

    await this.db.executeSql('UPDATE chats SET title = ? WHERE id = ?', [
      title,
      chatId,
    ]);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
