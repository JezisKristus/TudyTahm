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

        [HttpPost("AddUserToMap")]
        public async Task<IActionResult> AddUserToMap([FromBody] UserEmailPermission dto) {

            var user = await context.Users.FirstOrDefaultAsync(u => u.UserEmail == dto.Email);

            if (user == null) { return NotFound(); }

            MapPermission perm = new MapPermission() {
                IDMap = dto.MapID,
                IDUser = user.UserID,
                Permission = dto.Permission
            };

            context.MapPermissions.Add(perm);

            await context.SaveChangesAsync();
            
            return Ok(perm);
        }

        [HttpPut("EditUserPermissionOnMap/{mapID}")]
        public async Task<IActionResult> EditPerm([FromBody] UserPermissionDTO dto) {
            var perm = await context.MapPermissions.FirstOrDefaultAsync(p => p.IDMap == dto.MapID && p.IDUser == dto.UserID);

            if (perm == null) { return NotFound(); }

            perm.Permission = dto.Permission;

            await context.SaveChangesAsync();

            return Ok(perm);
        }

        [HttpDelete("RemoveUserFromMap/{mapID}")]
        public async Task<IActionResult> RemoveUser([FromBody] UserPermissionDTO dto) {
            var perm = await context.MapPermissions.FirstOrDefaultAsync(p => p.IDUser == dto.UserID && p.IDMap == dto.MapID);

            if (perm == null) { return NotFound(); };

            context.MapPermissions.Remove(perm);

            await context.SaveChangesAsync();

            return Ok(perm);
        }
    }
}

