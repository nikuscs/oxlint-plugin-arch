export function searchActionFind(params: SearchParams) { return database.where('name', 'like', escapeLikeWildcards(params.query)); }
