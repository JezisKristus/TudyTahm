using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.DotNet.Scaffolding.Shared.Messaging;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using TT_API;

namespace TT_API.Attributes {
    public class HasMapPermissionAttribute : Attribute, IAsyncAuthorizationFilter {
        private readonly string _requiredPermission;

        public HasMapPermissionAttribute(string requiredPermission) {
            _requiredPermission = requiredPermission.ToLower();
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context) {
            var httpContext = context.HttpContext;
            var db = new MyContext();

            Console.WriteLine("\n=== Permission Check Debug ===");
            Console.WriteLine($"Required Permission: {_requiredPermission}");

            // Log all claims
            Console.WriteLine("\nUser Claims:");
            foreach (var claim in httpContext.User.Claims) {
                Console.WriteLine($"- {claim.Type}: {claim.Value}");
            }

            var userIdClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type == "userID");
            if (userIdClaim == null) {
                Console.WriteLine("\nERROR: No userID claim found in token");
                context.Result = new BadRequestObjectResult("No userID claim");
                return;
            }

            var userID = int.Parse(userIdClaim.Value);
            Console.WriteLine($"\nUser ID from token: {userID}");

            var mapIDStr = context.RouteData.Values["mapID"]?.ToString();
            if (mapIDStr == null || !int.TryParse(mapIDStr, out int mapID)) {
                Console.WriteLine("\nERROR: Invalid or missing mapID in route");
                context.Result = new BadRequestObjectResult("Map ID is missing or invalid.");
                return;
            }
            Console.WriteLine($"Map ID from route: {mapID}");

            // Check if map exists
            var map = await db.Maps.FindAsync(mapID);
            if (map == null) {
                Console.WriteLine($"\nERROR: Map {mapID} does not exist");
                context.Result = new NotFoundObjectResult("Map not found");
                return;
            }
            Console.WriteLine($"Map exists: {map.MapName}");

            // Check if user is the owner
            if (map.IDUser == userID) {
                Console.WriteLine("\nUser is the map owner - granting access");
                return;
            }

            // Check permissions
            var permission = await db.MapPermissions
                .FirstOrDefaultAsync(p => p.IDUser == userID && p.IDMap == mapID);

            if (permission == null) {
                Console.WriteLine($"\nERROR: No permission found for user {userID} on map {mapID}");
                context.Result = new BadRequestObjectResult(new { 
                    message = "Insufficient permission",
                    details = "No permission entry found for this user and map"
                });
                return;
            }

            Console.WriteLine($"\nFound permission: {permission.Permission}");
            if (!HasSufficientPermission(permission.Permission, _requiredPermission)) {
                Console.WriteLine($"ERROR: Permission {permission.Permission} is insufficient for required {_requiredPermission}");
                context.Result = new BadRequestObjectResult(new { 
                    message = "Insufficient permission",
                    details = $"Current permission ({permission.Permission}) is lower than required ({_requiredPermission})"
                });
                return;
            }

            Console.WriteLine("Permission check passed successfully\n");
        }

        private bool HasSufficientPermission(string actual, string required) {
            var levels = new List<string> { "read", "write", "owner" };
            return levels.IndexOf(actual) >= levels.IndexOf(required);
        }
    }
}
