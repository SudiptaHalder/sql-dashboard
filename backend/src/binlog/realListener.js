import MySQL from 'mysql2';
import Zongji from 'zongji';

class RealBinlogListener {
  constructor() {
    this.connection = null;
    this.zongji = null;
    this.io = null;
  }

  async start(io, config) {
    this.io = io;
    
    try {
      // Create MySQL connection
      this.connection = MySQL.createConnection({
        host: config.host,
        port: config.port || 3306,
        user: config.user,
        password: config.password,
        database: config.database
      });

      await new Promise((resolve, reject) => {
        this.connection.connect(err => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('✅ Connected to MySQL database');

      // Initialize Zongji binlog listener
      this.zongji = new Zongji(this.connection);

      this.zongji.on('ready', () => {
        console.log('📊 MySQL binlog listener ready');
      });

      this.zongji.on('binlog', async (event) => {
        try {
          const parsedEvent = this.parseBinlogEvent(event);
          if (parsedEvent) {
            const aiExplanation = await import('../ai/explain.js').then(module => 
              module.explainChange(parsedEvent)
            );
            
            const eventWithAI = {
              ...parsedEvent,
              aiExplanation,
              timestamp: new Date().toISOString(),
              id: Date.now() + Math.random(),
              real: true // Mark as real event
            };

            console.log('📊 Real MySQL event:', {
              type: eventWithAI.type,
              table: eventWithAI.table,
              database: config.database
            });

            this.io.emit('sql_activity', eventWithAI);
          }
        } catch (error) {
          console.error('Error processing binlog event:', error);
        }
      });

      // Start listening to binlog events
      this.zongji.start({
        startAtEnd: true,
        includeEvents: ['tablemap', 'writerows', 'updaterows', 'deleterows']
      });

    } catch (error) {
      console.error('❌ Failed to connect to MySQL:', error);
      this.io.emit('database_error', { 
        error: error.message,
        message: 'Failed to connect to MySQL. Falling back to simulation mode.'
      });
      // Fall back to simulation
      this.startSimulation();
    }
  }

  parseBinlogEvent(event) {
    switch (event.getEventName()) {
      case 'writerows':
        return {
          type: 'INSERT',
          table: event.tableMap[event.tableId].tableName,
          before: null,
          after: event.rows[0]
        };
      
      case 'updaterows':
        return {
          type: 'UPDATE',
          table: event.tableMap[event.tableId].tableName,
          before: event.rows[0].before,
          after: event.rows[0].after
        };
      
      case 'deleterows':
        return {
          type: 'DELETE',
          table: event.tableMap[event.tableId].tableName,
          before: event.rows[0],
          after: null
        };
      
      default:
        return null;
    }
  }

  startSimulation() {
    console.log('🔄 Starting simulation mode as fallback');
    // Use the existing simulation from listener.js
    const simulationInterval = setInterval(async () => {
      const mockEvent = this.generateMockEvent();
      const aiExplanation = await import('../ai/explain.js').then(module => 
        module.explainChange(mockEvent)
      );
      
      const eventWithAI = {
        ...mockEvent,
        aiExplanation,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random(),
        simulated: true
      };

      this.io.emit('sql_activity', eventWithAI);
    }, 5000);
  }

  generateMockEvent() {
    const events = [
      {
        type: 'UPDATE',
        table: 'users',
        before: { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
        after: { id: 1, name: 'John Smith', email: 'john@example.com', status: 'active' }
      },
      {
        type: 'INSERT',
        table: 'orders',
        before: null,
        after: { id: 1001, user_id: 1, amount: 99.99, status: 'pending' }
      }
    ];
    return events[Math.floor(Math.random() * events.length)];
  }

  stop() {
    if (this.zongji) {
      this.zongji.stop();
    }
    if (this.connection) {
      this.connection.end();
    }
  }
}

export default RealBinlogListener;