import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { getRouteOneNotes } from './adapters/routeone.js';
import { getCudlNotes } from './adapters/cudl.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

const MW_TOKEN = process.env.MW_TOKEN;

app.use((req, res, next) => {
  const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!MW_TOKEN || tok !== MW_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

const CREDS = {
  LR1_SHARED: {
    routeone: { username: process.env.RO_USER_LR1, password: process.env.RO_PASS_LR1 },
    cudl:     { username: process.env.CU_USER_LR1, password: process.env.CU_PASS_LR1 }
  },

  LR2_SHARED: {
    routeone: { username: process.env.RO_USER_LR2, password: process.env.RO_PASS_LR2 },
    cudl:     { username: process.env.CU_USER_LR2, password: process.env.CU_PASS_LR2 }
  },

  LR5_SHARED: {
    routeone: { username: process.env.RO_USER_LR5, password: process.env.RO_PASS_LR5 },
    cudl:     { username: process.env.CU_USER_LR5, password: process.env.CU_PASS_LR5 }
  },

  LR7_SHARED: {
    routeone: { username: process.env.RO_USER_LR7, password: process.env.RO_PASS_LR7 },
    cudl:     { username: process.env.CU_USER_LR7, password: process.env.CU_PASS_LR7 }
  },

  LR11_SHARED: {
    routeone: { username: process.env.RO_USER_LR11, password: process.env.RO_PASS_LR11 },
    cudl:     { username: process.env.CU_USER_LR11, password: process.env.CU_PASS_LR11 }
  },

  LR12_SHARED: {
    routeone: { username: process.env.RO_USER_LR12, password: process.env.RO_PASS_LR12 },
    cudl:     { username: process.env.CU_USER_LR12, password: process.env.CU_PASS_LR12 }
  },

  TEST: {
    routeone: { username: process.env.RO_USER_TEST, password: process.env.RO_PASS_TEST },
    cudl:     { username: process.env.CU_USER_TEST, password: process.env.CU_PASS_TEST }
  }
};

const STORE_ALIAS = {
  'Automation Test Log': 'TEST',
  'LR1-T-Ford': 'LR1_SHARED',
  'LR1 - Commercial': 'LR1_SHARED',
  'LR2-T-Hyundai': 'LR2_SHARED',
  'LR5-L-Ford': 'LR5_SHARED',
  'LR7-L-Hyundai': 'LR7_SHARED',
  'LR11-Montana': 'LR11_SHARED',
  'LR12-Olathe': 'LR12_SHARED'
};

function normalizePlatform(p) {
  const s = (p || '').toString().trim().toLowerCase();
  if (s === 'routeone' || s === 'route one') return 'RouteOne';
  if (s === 'cudl') return 'CUDL';
  return p;
}

app.post('/lender-notes', async (req, res) => {
  try {
    let { platform, applicationId, storeKey } = req.body || {};
    if (!platform || !applicationId || !storeKey) {
      return res.status(400).json({ error: 'platform, applicationId, and storeKey required' });
    }

    platform = normalizePlatform(platform);
    const bucket = STORE_ALIAS[storeKey];
    if (!bucket) return res.status(404).json({ error: `Unknown storeKey: ${storeKey}` });

    const cfg = CREDS[bucket];
    if (!cfg) return res.status(500).json({ error: `Missing credential bucket: ${bucket}` });

    let notes = '';
    if (platform === 'RouteOne') {
      notes = await getRouteOneNotes(applicationId, cfg.routeone);
    } else if (platform === 'CUDL') {
      notes = await getCudlNotes(applicationId, cfg.cudl);
    } else {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    return res.json({ notes: (notes || '').trim() });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || 'fetch failed' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`CIT middleware listening on ${port}`));
