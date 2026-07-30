import { Hono } from 'hono'
import type { Env } from '../db/queries'

import publicApi from './routes/public'
import adminInboxes from './routes/admin-inboxes'
import apiKeys from './routes/api-keys'
import settings from './routes/settings'

const api = new Hono<{ Bindings: Env }>()

api.route('/api', publicApi)
api.route('/dashboard/inboxes', adminInboxes)
api.route('/dashboard/apikeys', apiKeys)
api.route('/', settings)

export default api
