using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using Microsoft.Build.Framework;
using Org.BouncyCastle.Asn1;
using System.Runtime.CompilerServices;
using TT_API.Attributes;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class MapController : ControllerBase {

        MyContext context = new MyContext();

        [Authorize]
        [HttpGet("ByUserID/{userID}")]
        public async Task<IActionResult> GetMapsByUser(int userID) {
            var maps = await context.Maps
                .Where(m => m.IDUser == userID)
                .ToListAsync();

            return Ok(maps);
        }

        [Authorize]
        [HttpGet("SharedMaps/{userID}")]
        public async Task<IActionResult> GetSharedMaps(int userID) {
            try {
                // Get maps where user is the owner
                var ownedMaps = await context.Maps
                    .Where(m => m.IDUser == userID)
                    .Select(m => new {
                        m.MapID,
                        m.MapName,
                        m.MapDescription,
                        m.MapPreviewPath,
                        m.IDUser,
                        Permission = "owner"
                    })
                    .ToListAsync();

                // Get maps shared with the user
                var sharedMaps = await context.MapPermissions
                    .Include(r => r.Map)
                    .Where(r => r.IDUser == userID)
                    .Select(r => new {
                        r.Map.MapID,
                        r.Map.MapName,
                        r.Map.MapDescription,
                        r.Map.MapPreviewPath,
                        r.Map.IDUser,
                        r.Permission
                    })
                    .ToListAsync();

                // Combine both lists, removing duplicates
                var allMaps = ownedMaps
                    .Concat(sharedMaps)
                    .GroupBy(m => m.MapID)
                    .Select(g => g.First())
                    .ToList();

                return Ok(allMaps);
            }
            catch (Exception ex) {
                return BadRequest(new { message = "Error retrieving shared maps" });
            }
        }

        [Authorize]
        [HasMapPermission("read")]
        [HttpGet("SharedUsers/{mapID}")]
        public async Task<IActionResult> GetSharedUsers(int mapID) {
            var users = await context.MapPermissions
                .Include(r => r.User)
                .Where(r => r.IDMap == mapID)
                .Select(r => new {
                    r.User.UserID,
                    r.User.UserName,
                    r.Permission
                }).ToListAsync();

            if (users == null) return NotFound();

            return Ok(users);
        }

        [Authorize]
        [HasMapPermission("read")]
        [HttpGet("ByMapID/{mapID}")]
        public async Task<IActionResult> GetMap(int mapID) {
            var map = await context.Maps.FindAsync(mapID);
            return Ok(map);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> AddMap([FromBody] CreateMapDTO dto) {
            Map map = new Map() {
                IDUser = dto.IDUser,
                MapName = dto.MapName,
                MapPreviewPath = @"bg.jpg",
                MapDescription = dto.MapDescription,
            };

            context.Maps.Add(map);
            await context.SaveChangesAsync();

            context.MapPermissions.Add(new MapPermission { IDMap = map.MapID, IDUser = map.IDUser, Permission = "owner"});
            await context.SaveChangesAsync();

            return Ok(map.MapID);
        }

        [Authorize]
        [HasMapPermission("owner")]
        [HttpDelete("{mapID}")]
        public async Task<IActionResult> DeleteMap(int mapID) {
            var mapToDelete = await context.Maps.FindAsync(mapID);
            var perissionsToDelete = await context.MapPermissions.Where(p => p.IDMap == mapID).ToListAsync();

            try {
                context.Maps.Remove(mapToDelete);
                context.MapPermissions.RemoveRange(perissionsToDelete);
            } catch {
                return NotFound();
            }

            await context.SaveChangesAsync();
            return Ok();
        }

        [Authorize]
        [HasMapPermission("owner")]
        [HttpPut("RenameMap/{mapID}")]
        public async Task<IActionResult> UpdateMapInfo([FromBody] CreateMapDTO dto, int mapID) {
            var map = await context.Maps.FindAsync(mapID);

            if (map == null) return NotFound();

            map.MapName = dto.MapName;
            map.MapDescription = dto.MapDescription;

            await context.SaveChangesAsync();
            return Ok(map);
        }

        //[Authorize]
        //[HttpPut("UploadMapPreview/{mapID}")]

        //public async Task<IActionResult> UploadPreview([FromForm] IFormFile image, int mapID) {

        //    var map = await context.Maps.FindAsync(mapID);


        //}
    }
}
