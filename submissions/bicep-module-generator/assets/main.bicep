param location string = resourceGroup().location
param appName string

module storage './storage.bicep' = {
  name: 'sa'
  params: {
    name: toLower(replace('${appName}sa', '-', ''))
    location: location
    tags: { app: appName }
  }
}

output storageId string = storage.outputs.id
