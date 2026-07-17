@description('Storage account name.')
@minLength(3)
@maxLength(24)
param name string

@description('Region.')
param location string = resourceGroup().location

@description('SKU.')
@allowed(['Standard_LRS', 'Standard_GRS', 'Standard_ZRS'])
param sku string = 'Standard_LRS'

@description('Tags.')
param tags object = {}

resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: sku }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

output id string = sa.id
output name string = sa.name
