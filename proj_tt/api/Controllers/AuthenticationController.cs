using JWT.Algorithms;
using JWT.Builder;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Services;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace TT_API.Controllers {
    [ApiController]
    [Route("api/[controller]")]

    public class AuthenticationController : ControllerBase {
        private TokensService service = new TokensService();

        MyContext context = new MyContext();

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO logindto) {
            var user = await context.Users.FirstOrDefaultAsync(u => u.UserName == logindto.Username);

            if (user == null) { return NotFound(new { message = "User not found." }); }

            if (!user.UserPassword.Equals(logindto.Password)) { return Unauthorized(new { message = "Invalid credentials." }); }

            var token = service.Create(user);

            return Ok(new { token });
        }

        [HttpPost("Register")]

        //adduser
        public async Task<IActionResult> Register([FromBody] CreateUpdateUserDTO registerdto) {
            User user = new User() {
                UserName = registerdto.UserName,
                UserPassword = registerdto.UserPassword,
                UserEmail = registerdto.UserEmail,
                UserIconPath = @"pfp\default.png",
            };

            context.Users.Add(user);

            await context.SaveChangesAsync();

            return Ok();
        }


        [HttpPut("UpdateUser/{userID}")]
        public async Task<IActionResult> UpdateUser([FromBody] CreateUpdateUserDTO dto, int userID) {
            var user = await context.Users.FindAsync(userID);

            user.UserName = dto.UserName;
            user.UserPassword = dto.UserPassword;
            user.UserEmail = dto.UserEmail;

            await context.SaveChangesAsync();

            return Ok();
        }

        //[HttpPut("UploadPFP/{userID}")]
        //public async Task<IActionResult> UploadPFP(IFormFile image, int userID) {

        //    var user = await context.Users.FindAsync(userID);

        //    if (user == null) return NotFound();

        //    if (user.UserIconPath.Equals(@"pfp\default.png")) { user.UserIconPath = @"pfp\" + user.UserID + "_" + user.UserName.ToLower().Replace(' ', '-'); }

        //    var extension = Path.GetExtension(image.FileName).ToLower();

        //    var icon

        //    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };

        //    if (!allowedExtensions.Contains(extension)) {
        //        return BadRequest(new { message = "Invalid file type. Only JPG and PNG are allowed." });
        //    }

        //    if (image != null && image.Length > 0) {
        //        var fileName = user.

        //        using (var stream = new FileStream(@"..\assets\pfp\", FileMode.Create)) {
        //            await image.CopyToAsync(stream);
        //        }

        //        return Ok();
        //    }

        //    return BadRequest();
        //}
    }
}