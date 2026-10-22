// Jason Stys: private read-only Azure Container Apps reference; symbols: docs/SOURCE_MAP.md.
targetScope = 'resourceGroup'

@description('Existing private Container Apps environment. No subscription resources are created by tests.')
param environmentName string
@description('Existing workload identity with minimum Key Vault secret-read permission.')
param identityName string
@description('An image built from reviewed source, pinned to its sha256 digest in a registry you control.')
param image string
@description('Key Vault URI for a dedicated PostgreSQL connection secret; never the secret value.')
param databaseSecretUri string
@minLength(3)
@maxLength(30)
param appName string = 'drone-operations-console'

resource environment 'Microsoft.App/managedEnvironments@2025-01-01' existing = {
  name: environmentName
}
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: identityName
}
resource app 'Microsoft.App/containerApps@2025-01-01' = {
  name: appName
  location: resourceGroup().location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8840
        transport: 'http'
        allowInsecure: false
      }
      secrets: [
        {
          name: 'database-url'
          keyVaultUrl: databaseSecretUri
          identity: identity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'console'
          image: image
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'OPS_ORIGIN'
              value: 'https://${appName}.internal.${environment.properties.defaultDomain}'
            }
            {
              name: 'OPS_DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'OPS_READ_ONLY'
              value: '1'
            }
            {
              name: 'OPS_ADAPTER'
              value: 'replay'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/healthz'
                port: 8840
                scheme: 'HTTP'
                httpHeaders: [
                  {
                    name: 'Host'
                    value: '${appName}.internal.${environment.properties.defaultDomain}'
                  }
                ]
              }
              initialDelaySeconds: 10
              periodSeconds: 15
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}
output privateFqdn string = app.properties.configuration.ingress.fqdn
