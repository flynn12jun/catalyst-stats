import { HTTPProvider } from 'eth-connect'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import {
  createServerComponent,
  createStatusCheckComponent,
  IHttpServerOptions
} from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createNatsComponent } from '@well-known-components/nats-component'
import { createFetchComponent } from './ports/fetch'
import { createMetricsComponent } from '@well-known-components/metrics'
import { catalystRegistryForProvider } from '@dcl/catalyst-contracts'
import { createContentComponent } from './ports/content'
import { AppComponents, GlobalContext } from './types'
import { metricDeclarations } from './metrics'
import { createStatsComponent } from './ports/stats'
import 'isomorphic-fetch'
import { networks } from '@zqbflynn/catalyst-node-commons'

const DEFAULT_ETH_NETWORK = 'goerli'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const ethNetwork = (await config.getString('ETH_NETWORK')) ?? DEFAULT_ETH_NETWORK

  const logs = await createLogComponent({})

  const serverOptions: Partial<IHttpServerOptions> = {
    cors: {
      origin: true,
      methods: 'GET,HEAD,POST,PUT,DELETE,CONNECT,TRACE,PATCH',
      allowedHeaders: ['Cache-Control', 'Content-Type', 'Origin', 'Accept', 'User-Agent', 'X-Upload-Origin'],
      credentials: true,
      maxAge: 86400
    }
  }

  const server = await createServerComponent<GlobalContext>({ config, logs }, serverOptions)
  const statusChecks = await createStatusCheckComponent({ server, config })
  const fetch = await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })
  const nats = await createNatsComponent({ config, logs })
  const network = networks['zqb']
  const ethereumProvider = new HTTPProvider(network.http)

  const contract = await catalystRegistryForProvider(ethereumProvider)
  const content = await createContentComponent({ config })
  const stats = createStatsComponent()
  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics,
    nats,
    contract,
    content,
    stats
  }
}
