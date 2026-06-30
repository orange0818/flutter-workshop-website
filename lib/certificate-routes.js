import {
  getHashedFilename,
  SALT,
} from './certificate-data.js';

function sendJson(res, status, body) {
  return res.status(status).json(body);
}

export function createCertificateHandlers({ rootDir, certificateData, logAccess }) {
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

    preview(req, res) {
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
      const hashedFilename = getHashedFilename(student.name);
      logAccess(student.name, 'SUCCESS - preview_redirect', clientIP, Date.now() - startTime);
      return res.redirect(`/assets/certificates/student/${hashedFilename}?secret=${SALT}`);
    },

    download(req, res) {
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
      const hashedFilename = getHashedFilename(student.name);
      logAccess(student.name, 'SUCCESS - download_redirect', clientIP, Date.now() - startTime);
      return res.redirect(`/assets/certificates/student/${hashedFilename}?secret=${SALT}`);
    },
  };
}
