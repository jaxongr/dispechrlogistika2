import * as winston from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        isProduction
          ? winston.format.json()
          : nestWinstonModuleUtilities.format.nestLike('Dispatchr', {
              colors: true,
              prettyPrint: true,
            }),
      ),
    }),
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});
