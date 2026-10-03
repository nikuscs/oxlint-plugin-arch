export function searchActionFind(params: SearchParams) {
  return database.where('name', 'like', params.query);
}
