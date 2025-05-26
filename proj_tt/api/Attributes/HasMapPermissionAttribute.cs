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
            var db = httpContext.RequestServices.GetService<MyContext>();

            var userIdClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type == "userID");
            if (userIdClaim == null) {
                context.Result = new BadRequestObjectResult("No userID claim");
                return;
            }

            var userID = int.Parse(userIdClaim.Value);

            var mapIDStr = context.RouteData.Values["mapID"]?.ToString();
            if (mapIDStr == null || !int.TryParse(mapIDStr, out int mapID)) {
                context.Result = new BadRequestObjectResult("Map ID is missing or invalid.");
                return;
            }

            var permission = await db.MapPermissions
                .FirstOrDefaultAsync(p => p.IDUser == userID && p.IDMap == mapID);

            if (permission == null || !HasSufficientPermission(permission.Permission, _requiredPermission)) {
                context.Result = new BadRequestObjectResult("Invalid permission");
            }
        }

        private bool HasSufficientPermission(string actual, string required) {
            var levels = new List<string> { "read", "write", "owner" };
            return levels.IndexOf(actual) >= levels.IndexOf(required);
        }
    }
}
