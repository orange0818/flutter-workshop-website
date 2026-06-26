import {
  getCertificatePath,
  validateCertificateFileName,
  getHashedFilename,
  SALT,
} from './certificate-data.js';
import {
  applySecureImageHeaders,
  createBlurredPreview,
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

  function verifyCode(student, code) {
    const normalizedCode = String(code || '').trim().toLowerCase();
    if (!normalizedCode) {
      return { error: { status: 400, body: { error: 'Certificate code is required' } } };
    }
    if (student.normalizedCode !== normalizedCode) {
      return { error: { status: 403, body: { error: 'Certificate code does not match' } } };
    }
    return { ok: true };
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

      const assignmentCompleted = certificateData.hasCompletedAssignment(student.name);
      logAccess(student.name, 'SUCCESS - status_lookup', clientIP, Date.now() - startTime);

      return res.status(200).json({
        name: student.name,
        inCandidateList: true,
        assignmentCompleted,
        canDownload: assignmentCompleted,
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

      const assignmentCompleted = certificateData.hasCompletedAssignment(student.name);
      logAccess(student.name, 'SUCCESS - code_lookup', clientIP, Date.now() - startTime);

      return res.status(200).json({
        name: student.name,
        assignmentCompleted,
        canDownload: assignmentCompleted,
      });
    },

    async preview(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const name = String(req.query.name || '').trim();
      const code = String(req.query.code || '').trim();

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
      const assignmentCompleted = certificateData.hasCompletedAssignment(student.name);
      const buffer = await loadCertificateOrRespond(student, req, res, clientIP, startTime);
      if (!buffer) return;

      if (!assignmentCompleted) {
        const blurred = await createBlurredPreview(buffer);
        applySecureImageHeaders(res, { attachment: false });
        logAccess(student.name, 'SUCCESS - blurred_preview', clientIP, Date.now() - startTime);
        res.setHeader('Content-Length', blurred.length);
        return res.status(200).send(blurred);
      }

      const codeCheck = verifyCode(student, code);
      if (codeCheck.error) {
        logAccess(student.name, 'REJECTED - code_required_for_preview', clientIP, Date.now() - startTime);
        return sendJson(res, codeCheck.error.status, codeCheck.error.body);
      }

      applySecureImageHeaders(res, { attachment: false });
      logAccess(student.name, 'SUCCESS - full_preview', clientIP, Date.now() - startTime);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    },

    async download(req, res) {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress;
      const name = String(req.query.name || '').trim();
      const code = String(req.query.code || '').trim();

      if (!name || !code) {
        logAccess(name || 'unknown', 'REJECTED - invalid_params', clientIP, Date.now() - startTime);
        return sendJson(res, 400, {
          error: 'Missing or invalid parameters',
          required: { name: 'string', code: 'string' },
        });
      }

      const lookup = lookupByName(name);
      if (lookup.error) {
        logAccess(name, 'REJECTED - student_not_found', clientIP, Date.now() - startTime);
        return sendJson(res, lookup.error.status, lookup.error.body);
      }

      const { student } = lookup;

      if (!certificateData.hasCompletedAssignment(student.name)) {
        logAccess(student.name, 'REJECTED - assignment_incomplete', clientIP, Date.now() - startTime);
        return sendJson(res, 403, {
          error: 'Assignment not completed. Certificate download is locked.',
        });
      }

      const codeCheck = verifyCode(student, code);
      if (codeCheck.error) {
        logAccess(student.name, 'REJECTED - code_mismatch', clientIP, Date.now() - startTime);
        return sendJson(res, codeCheck.error.status, codeCheck.error.body);
      }

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
