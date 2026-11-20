# Express Hardening Reference

## 1. Grep Targets
`app.use(`, `cors(`, `express.json`, `req.body`, `multer`, `jwt.sign`, `catch (`, `err, req, res, next`

## 2. Framework Traps
- **Broken Error Handler:** Global handler must have exactly 4 arguments `(err, req, res, next)`. Omitting `next` makes Express treat it as standard middleware, breaking error trapping.
- **Unhandled Async Errors:** Express <= 4 does not catch rejected promises in async route handlers; unhandled rejections crash or hang requests without `express-async-errors` or try/catch.
- **Origin Reflection:** `cors({ origin: true, credentials: true })` reflects any `Origin` header with credentials, bypassing CORS.
- **Rate Limit Bypass:** Missing `app.set('trust proxy', 1)` behind reverse proxies causes `express-rate-limit` to key off proxy IP, throttling all users globally or bypassing limits via spoofed headers.
- **Unbounded Multer Uploads:** Missing `limits: { fileSize }` or missing `fileFilter` MIME validation permits disk exhaustion and malicious file execution.
- **Mass Assignment:** Spreading `req.body` into `.create(req.body)` or `.findByIdAndUpdate(id, req.body)` allows arbitrary field overwrites (`role`, `isAdmin`, `verified`).

## 3. Safe Fix Patterns

### Safe Async, Headers & Body Limits
```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || false, credentials: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', authLimiter);
```

### Multer Hardening & Error Redaction
```javascript
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Redacted 4-arg global error handler
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal Server Error' : err.message,
    ...(isProd ? {} : { stack: err.stack })
  });
});
```
