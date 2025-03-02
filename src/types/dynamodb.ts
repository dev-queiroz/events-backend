// Item genérico retornado pelo DynamoDB
export interface DynamoDBItem {
  [key: string]: any; // Flexível para diferentes atributos
}

// Resultado de uma operação GetItem
export interface DynamoDBGetItemResponse {
  Item?: DynamoDBItem;
}

// Resultado de uma operação Scan ou Query
export interface DynamoDBScanResponse {
  Items?: DynamoDBItem[];
  Count?: number;
  ScannedCount?: number;
  LastEvaluatedKey?: DynamoDBItem;
}

// Resultado de uma operação UpdateItem com atributos retornados
export interface DynamoDBUpdateItemResponse {
  Attributes?: DynamoDBItem;
}
