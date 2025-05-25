using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Win32.SafeHandles;


namespace TT_API.Controllers {


    [ApiController]
    [Route("api/[controller]")]

    public class ShareController : ControllerBase {

        private MyContext context = new MyContext();

        [HttpPost("AddUserToMap{mapID}")]
        public async Task<IActionResult> AddUserToMap([FromBody] UserPermissionDTO dto, int mapID) {

            MapPermission perm = new MapPermission() {
                IDMap = mapID,
                IDUser = dto.UserID,
                Permission = dto.Permission
            };

            context.MapPermissions.Add(perm);

            await context.SaveChangesAsync();
            
            return Ok(perm);
        }

        [HttpPut("EditUserPermissionOnMap{mapID}")]
        public async Task<IActionResult> EditPerm([FromBody] UserPermissionDTO dto, int mapID) {
            var perm = await context.MapPermissions.FirstOrDefaultAsync(p => p.IDMap == mapID && p.IDUser == dto.UserID);

            if (perm == null) { return NotFound(); }

            perm.Permission = dto.Permission;

            await context.SaveChangesAsync();

            return Ok(perm);
        }

        [HttpDelete("RemoveUserFromMap{mapID}")]
        public async Task<IActionResult> RemoveUser([FromBody] int userID, int mapID) {
            var perm = await context.MapPermissions.FirstOrDefaultAsync(p => p.IDUser == userID && p.IDMap == mapID);

            if (perm == null) { return NotFound(); };

            context.MapPermissions.Remove(perm);

            await context.SaveChangesAsync();

            return Ok(perm);
        }
    }
}

