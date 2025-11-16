import MySQL from 'mysql2';

class BinlogListener {
  constructor() {
    this.connection = null;
    this.io = null;
    this.currentConfig = null;
    this.isConnected = false;
  }

  async start(io, config) {
    this.io = io;
    this.currentConfig = config;
    
    console.log('🚀 Starting REAL database connection');
    
    try {
      await this.connectToDatabase(config);
      console.log('✅ REAL database connected - Ready for real data');
    } catch (error) {
      console.error('❌ REAL database connection failed:', error.message);
    }
  }

  async connectToDatabase(config) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔗 Connecting to REAL database...');

        this.connection = MySQL.createConnection({
          host: config.host,
          port: config.port || 3306,
          user: config.user,
          password: config.password,
          database: config.database,
          charset: 'utf8mb4',
          connectTimeout: 10000,
          insecureAuth: true
        });

        await new Promise((resolve, reject) => {
          this.connection.connect(err => {
            if (err) {
              reject(err);
            } else {
              this.isConnected = true;
              console.log('✅ REAL database connected successfully');
              
              this.io.emit('database_status', {
                status: 'connected',
                message: 'Connected to REAL database - Browse your tables',
                database: config.database,
                timestamp: new Date().toISOString(),
                realData: true
              });
              
              resolve();
            }
          });
        });

        resolve();

      } catch (error) {
        this.isConnected = false;
        reject(error);
      }
    });
  }

  stop() {
    if (this.connection && this.connection.state !== 'disconnected') {
      this.connection.end();
    }
    this.connection = null;
    this.isConnected = false;
    console.log('🛑 Database connection closed');
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      database: this.currentConfig?.database,
      status: this.isConnected ? 'connected' : 'disconnected',
      realData: true
    };
  }
}

export default new BinlogListener;