//================ apply ===============
// async findOne(groupDirectionId: number) {
//   const isGroupDirId = await this.prisma.groupDirection.findUnique({
//     where: { id: groupDirectionId },
//   });
//   if (!isGroupDirId) {
//     throw new NotFoundException();
//   }

//   const directions = await this.prisma.direction.findMany({
//     where: {
//       groupDirectionId,
//     },
//   });

//   if (directions.length === 0) {
//     return [];
//   }

//   const groupedByRoute = this.groupByRoute(directions);
//   for (const group of groupedByRoute) {
//     group.directions = this.applyNNA(group.directions);
//   }

//   return groupedByRoute;
// }

// // Group directions by route
// private groupByRoute(directions: any[]): any[] {
//   const grouped = directions.reduce((acc, direction) => {
//     const route = direction.route;
//     if (!acc[route]) {
//       acc[route] = {
//         route,
//         directions: [],
//       };
//     }
//     acc[route].directions.push(direction);
//     return acc;
//   }, {});

//   return Object.values(grouped);
// }

// // Utility method to calculate distance between two locations
// private calculateDistance(loc1: any, loc2: any): number {
//   const lat1 = loc1.lat;
//   const lon1 = loc1.long;
//   const lat2 = loc2.lat;
//   const lon2 = loc2.long;

//   const p = 0.017453292519943295; // Math.PI / 180
//   const c = Math.cos;
//   const a =
//     0.5 -
//     c((lat2 - lat1) * p) / 2 +
//     (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;

//   return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
// }

// // Nearest Neighbor Algorithm to find the shortest route sequence
// private applyNNA(directions: any[]): any[] {
//   if (directions.length <= 1) {
//     return directions;
//   }

//   const sortedDirections = [];
//   let current = directions[0];
//   sortedDirections.push(current);

//   const remaining = [...directions.slice(1)];

//   while (remaining.length) {
//     let nearestIndex = 0;
//     let nearestDistance = this.calculateDistance(current, remaining[0]);

//     for (let i = 1; i < remaining.length; i++) {
//       const distance = this.calculateDistance(current, remaining[i]);
//       if (distance < nearestDistance) {
//         nearestIndex = i;
//         nearestDistance = distance;
//       }
//     }

//     current = remaining.splice(nearestIndex, 1)[0];
//     sortedDirections.push(current);
//   }

//   return sortedDirections;
// }

// ============== use =============
// async findOne(groupDirectionId: number) {
//   const isGroupDirId = await this.prisma.groupDirection.findUnique({
//     where: { id: groupDirectionId },
//   });
//   if (!isGroupDirId) {
//     throw new NotFoundException();
//   }

//   const directions = await this.prisma.direction.findMany({
//     where: {
//       groupDirectionId,
//     },
//   });

//   if (directions.length === 0) {
//     return [];
//   }

//   // Find the optimal sequence by shortest total distance
//   const optimalRoute = this.findOptimalRoute(directions);

//   return this.groupByRoute(optimalRoute);
// }

// findOptimalRoute(directions: any[]) {
//   const pairwiseDistances = this.calculateAllPairwiseDistances(directions);

//   let bestRoute = null;
//   let shortestDistance = Infinity;

//   for (let i = 0; i < directions.length; i++) {
//     const { route, totalDistance } = this.findShortestRoute(
//       i,
//       directions,
//       pairwiseDistances,
//     );

//     if (totalDistance < shortestDistance) {
//       shortestDistance = totalDistance;
//       bestRoute = route;
//     }
//   }

//   return bestRoute;
// }

// findShortestRoute(startIndex: number, directions: any[], distances: any) {
//   const remaining = [...directions];
//   const optimalSequence = [remaining.splice(startIndex, 1)[0]];
//   let currentLocation = optimalSequence[0];
//   let totalDistance = 0;

//   while (remaining.length > 0) {
//     let shortestDistance = Infinity;
//     let closestDirectionIndex = -1;

//     for (let i = 0; i < remaining.length; i++) {
//       const distance = distances[currentLocation.id][remaining[i].id];

//       if (distance < shortestDistance) {
//         shortestDistance = distance;
//         closestDirectionIndex = i;
//       }
//     }

//     totalDistance += shortestDistance;
//     currentLocation = remaining.splice(closestDirectionIndex, 1)[0];
//     optimalSequence.push(currentLocation);
//   }

//   return { route: optimalSequence, totalDistance };
// }

// calculateAllPairwiseDistances(directions: any[]) {
//   const distances = {};

//   for (let i = 0; i < directions.length; i++) {
//     distances[directions[i].id] = {};

//     for (let j = 0; j < directions.length; j++) {
//       if (i !== j) {
//         distances[directions[i].id][directions[j].id] =
//           this.calculateLineDistance(
//             directions[i].lat,
//             directions[i].long,
//             directions[j].lat,
//             directions[j].long,
//           );
//       }
//     }
//   }

//   return distances;
// }

// calculateLineDistance(
//   lat1: number,
//   long1: number,
//   lat2: number,
//   long2: number,
// ): number {
//   const toRadians = (degree: number) => degree * (Math.PI / 180);

//   const R = 6371; // Radius of the Earth in kilometers
//   const dLat = toRadians(lat2 - lat1);
//   const dLong = toRadians(long2 - long1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(lat1)) *
//       Math.cos(toRadians(lat2)) *
//       Math.sin(dLong / 2) *
//       Math.sin(dLong / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c; // Distance in kilometers
// }

// groupByRoute(directions: any[]) {
//   const grouped = directions.reduce((acc, direction) => {
//     const route = direction.route;
//     if (!acc[route]) {
//       acc[route] = { route, directions: [] };
//     }
//     acc[route].directions.push(direction);
//     return acc;
//   }, {});

//   return Object.values(grouped);
// }
//============= start can use =================
// // Method to find the optimal route for a given groupDirectionId
// async findOne(groupDirectionId: number) {
//   // Check if the groupDirectionId exists in the database
//   const isGroupDirId = await this.prisma.groupDirection.findUnique({
//     where: { id: groupDirectionId },
//   });

//   // If the groupDirectionId does not exist, throw a NotFoundException
//   if (!isGroupDirId) {
//     throw new NotFoundException();
//   }

//   // Retrieve all directions associated with the groupDirectionId
//   const directions = await this.prisma.direction.findMany({
//     where: {
//       groupDirectionId,
//     },
//   });

//   // If no directions are found, return an empty array
//   if (directions.length === 0) {
//     return [];
//   }

//   // Find the optimal sequence of directions by shortest total distance
//   const optimalRoute = await this.findOptimalRoute(directions);

//   // Group the directions by their route and return
//   return this.groupByRoute(optimalRoute);
// }

// // Method to find the optimal route by evaluating all permutations
// async findOptimalRoute(directions: any[]) {
//   // Calculate pairwise distances between all directions
//   const pairwiseDistances =
//     await this.calculateAllPairwiseDistances(directions);

//   // Get all permutations of the directions
//   const permutations = this.getPermutations(directions);

//   let bestRoute = null;
//   let shortestDistance = Infinity;

//   // Iterate through each permutation to find the shortest route
//   for (const route of permutations) {
//     const totalDistance = this.calculateTotalDistance(
//       route,
//       pairwiseDistances,
//     );

//     // Update the best route if a shorter distance is found
//     if (totalDistance < shortestDistance) {
//       shortestDistance = totalDistance;
//       bestRoute = route;
//     }
//   }

//   // Return the best route found
//   return bestRoute;
// }

// // Method to calculate total distance for a given route
// calculateTotalDistance(route: any[], distances: any): number {
//   let totalDistance = 0;

//   for (let i = 0; i < route.length - 1; i++) {
//     totalDistance += distances[route[i].id][route[i + 1].id];
//   }

//   return totalDistance;
// }

// // Method to generate all permutations of an array
// getPermutations(arr: any[]): any[][] {
//   const result: any[][] = [];

//   const generate = (n: number, heapArr: any[]) => {
//     if (n === 1) {
//       result.push(heapArr.slice());
//       return;
//     }

//     generate(n - 1, heapArr);

//     for (let i = 0; i < n - 1; i++) {
//       if (n % 2 === 0) {
//         [heapArr[i], heapArr[n - 1]] = [heapArr[n - 1], heapArr[i]];
//       } else {
//         [heapArr[0], heapArr[n - 1]] = [heapArr[n - 1], heapArr[0]];
//       }
//       generate(n - 1, heapArr);
//     }
//   };

//   generate(arr.length, arr.slice());
//   return result;
// }

// // Method to calculate pairwise distances between all directions
// async calculateAllPairwiseDistances(directions: any[]) {
//   const distances = {};

//   // Iterate through each pair of directions to calculate the distance
//   for (let i = 0; i < directions.length; i++) {
//     distances[directions[i].id] = {};

//     for (let j = 0; j < directions.length; j++) {
//       if (i !== j) {
//         distances[directions[i].id][directions[j].id] =
//           await this.calculateLineDistance(
//             directions[i].lat,
//             directions[i].long,
//             directions[j].lat,
//             directions[j].long,
//           );
//       }
//     }
//   }

//   // Return the calculated distances
//   return distances;
// }

// // Method to calculate the distance between two geographical points using the Haversine formula
// async calculateLineDistance(
//   lat1: number,
//   long1: number,
//   lat2: number,
//   long2: number,
// ): Promise<number> {
//   // Helper function to convert degrees to radians
//   const toRadians = (degree: number) => degree * (Math.PI / 180);

//   const R = 6371; // Radius of the Earth in kilometers
//   const dLat = toRadians(lat2 - lat1);
//   const dLong = toRadians(long2 - long1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(lat1)) *
//       Math.cos(toRadians(lat2)) *
//       Math.sin(dLong / 2) *
//       Math.sin(dLong / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   // Return the distance in kilometers
//   return R * c;
// }

// // Method to group directions by their route
// groupByRoute(directions: any[]) {
//   const grouped = directions.reduce((acc, direction) => {
//     const route = direction.route;
//     if (!acc[route]) {
//       acc[route] = { route, directions: [] };
//     }
//     acc[route].directions.push(direction);
//     return acc;
//   }, {});

//   // Return the grouped directions as an array
//   return Object.values(grouped);
// }
//============= end can use =================
