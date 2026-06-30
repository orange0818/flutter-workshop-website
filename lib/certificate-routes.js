import {
  getCertificatePath,
  validateCertificateFileName,
  getHashedFilename,
  SALT,
} from './certificate-data.js';
import {
  applySecureImageHeaders,
  readCertificateBuffer,
} from './certificate-image.js';

function sendJson(res, status, body) {
  return res.status(status).json(body);
}

export function createCertificateHandlers({ rootDir, certificateData, logAccess }) {
  async function loadCertificateOrRespond(student, req, res, clientIP, startTime) {
    if (!validateCertificateFileName(student.name)) {
      logAccess(student.name, 'REJECTED - invalid_filename', clientIP, Date.now() - startTime);
      sendJson(res, 400, { error: 'Invalid file name format' });
      return null;
    }

    const certPath = getCertificatePath(rootDir, student.name);
    let buffer = readCertificateBuffer(certPath);
    
    if (!buffer) {
      // In production/serverless, fetch the file over HTTP from Vercel CDN using secret salt query parameter
      try {
        const hashedFilename = getHashedFilename(student.name);
        const host = req.get('host');
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const fetchUrl = `${protocol}://${host}/assets/certificates/student/${hashedFilename}?secret=${SALT}`;
        
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } catch (err) {
        logAccess(student.name, `REJECTED - fetch_failed (${err.message})`, clientIP, Date.now() - startTime);
        sendJson(res, 404, { error: 'Certificate file not found' });
        return null;
      }
    }

    return buffer;
  }

  function lookupByName(name) {
    const student = certificateData.findByName(name);
    if (!student) {
      return { error: { status: 404, body: { error: 'Student certificate not found' } } };
    }
    return { student };
  }

  return {
    searchNames(req, res) {
      const query = String(req.query.q || '').trim();
      const names = certificateData.searchNames(query);
      return res.status(200).json({ names });
    },

    statusByName(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const name = String(req.query.name || '').trim();

      if (!name) {
        logAccess('unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
        return sendJson(res, 400, { error: 'Student name is required' });
      }

      const student = certificateData.findByName(name);
      if (!student) {
        logAccess(name, 'REJECTED - student_not_found', clientIP, Date.now() - startTime);
        return sendJson(res, 404, { error: 'Student certificate not found' });
      }

      logAccess(student.name, 'SUCCESS - status_lookup', clientIP, Date.now() - startTime);

      return res.status(200).json({
        name: student.name,
        inCandidateList: true,
        canDownload: true,
      });
    },

    lookupByCode(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const code = String(req.query.code || '').trim();

      if (!code) {
        logAccess('unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
        return sendJson(res, 400, { error: 'Certificate code is required' });
      }

      const student = certificateData.findByCode(code);
      if (!student) {
        logAccess('unknown', 'REJECTED - code_not_found', clientIP, Date.now() - startTime);
        return sendJson(res, 404, { error: 'The code is invalid or the certificate does not exist.' });
      }

      logAccess(student.name, 'SUCCESS - code_lookup', clientIP, Date.now() - startTime);

      return res.status(200).json({
        name: student.name,
        canDownload: true,
      });
    },

    async preview(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const name = String(req.query.name || '').trim();

      if (!name) {
        logAccess('unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
        return sendJson(res, 400, { error: 'Student name is required' });
      }

      const lookup = lookupByName(name);
      if (lookup.error) {
        logAccess(name, 'REJECTED - student_not_found', clientIP, Date.now() - startTime);
        return sendJson(res, lookup.error.status, lookup.error.body);
      }

      const { student } = lookup;
      const buffer = await loadCertificateOrRespond(student, req, res, clientIP, startTime);
      if (!buffer) return;

      applySecureImageHeaders(res, { attachment: false });
      logAccess(student.name, 'SUCCESS - preview', clientIP, Date.now() - startTime);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    },

    async download(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const name = String(req.query.name || '').trim();

      if (!name) {
        logAccess('unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
        return sendJson(res, 400, {
          error: 'Missing or invalid parameters',
          required: { name: 'string' },
        });
      }

      const lookup = lookupByName(name);
      if (lookup.error) {
        logAccess(name, 'REJECTED - student_not_found', clientIP, Date.now() - startTime);
        return sendJson(res, lookup.error.status, lookup.error.body);
      }

      const { student } = lookup;
      const buffer = await loadCertificateOrRespond(student, req, res, clientIP, startTime);
      if (!buffer) return;

      applySecureImageHeaders(res, {
        attachment: true,
        fileName: `${student.name.replace(/\s+/g, '_')}_certificate.png`,
      });
      logAccess(student.name, 'SUCCESS - certificate_delivered', clientIP, Date.now() - startTime);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    },
  };
}
