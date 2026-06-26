/**
 * Audit logging endpoint for certificate access attempts
 * Deploy to: Vercel, Netlify, or AWS Lambda
 * 
 * Logs all certificate access attempts for security monitoring
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let logData;
    
    if (typeof req.body === 'string') {
      logData = JSON.parse(req.body);
    } else {
      logData = req.body;
    }

    const {
      timestamp,
      method,
      url,
      status,
      userAgent,
      studentName,
      ipAddress
    } = logData;

    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.socket?.remoteAddress || 
                     ipAddress || 
                     'unknown';

    // Log to console (in production, send to a logging service like Sentry, LogRocket, etc.)
    console.log(JSON.stringify({
      timestamp: timestamp || new Date().toISOString(),
      method,
      url,
      status,
      userAgent,
      studentName,
      ipAddress: clientIP,
      type: 'CERTIFICATE_ACCESS_AUDIT'
    }));

    // You can integrate with external logging services here:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    // - Custom logging endpoint

    return res.status(200).json({ 
      success: true,
      message: 'Audit log recorded'
    });
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't reveal error details to client
    return res.status(200).json({ 
      success: true,
      message: 'Request logged'
    });
  }
}
