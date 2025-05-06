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
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using TT_API.HelperClasses;

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

            if (!HashHelper.Verify(logindto.Password, user.UserPassword)) { return Unauthorized(new { message = "Invalid credentials." }); }

            var token = service.Create(user);

            return Ok(new { token, user.UserID});
        }

        [HttpPost("Register")]

        //adduser
        public async Task<IActionResult> Register([FromBody] CreateUpdateUserDTO registerdto) {
            User user = new User() {
                UserName = registerdto.UserName,
                UserPassword = HashHelper.Hash(registerdto.UserPassword),
                UserEmail = registerdto.UserEmail,
                UserIconPath = @"pfp\default.png",
            };

            context.Users.Add(user);

            await context.SaveChangesAsync();

            return Ok(user.UserID);
        }


        [HttpPut("UpdateUser/{userID}")]
        public async Task<IActionResult> UpdateUser([FromBody] CreateUpdateUserDTO dto, int userID) {
            var user = await context.Users.FindAsync(userID);

            user.UserName = dto.UserName;
            user.UserPassword = HashHelper.Hash(dto.UserPassword);
            user.UserEmail = dto.UserEmail;

            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpPut("UploadPFP/{userID}")]
        public async Task<IActionResult> UploadPFP(IFormFile image, int userID) {

            var user = await context.Users.FindAsync(userID);

            if (user == null) return NotFound();

            var extension = Path.GetExtension(image.FileName).ToLower();

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };

            if (!allowedExtensions.Contains(extension)) {
                return BadRequest(new { message = "Invalid file type. Only JPG and PNG are allowed." });
            }

            if (image != null && image.Length > 0) {
                var filename = @"pfp\" + user.UserID + "_" + user.UserName.ToLower().Replace(' ', '-') + extension;

                using (var stream = new FileStream(@"C:\TT_LOCAL\" + filename, FileMode.Create)) {
                    await image.CopyToAsync(stream);
                }

                return Ok();
            }

            return BadRequest();
        }

        //[Authorize]
        //[HttpGet("UserIDByToken")]
        //public async Task<IActionResult> GetUserInfoByToken() {
        //    var identity = User.Identity as ClaimsIdentity;

        //    return Ok(identity.FindFirst("userID").Value);
        //}

        [HttpGet("UserInfoByID/{id}")]
        public async Task<IActionResult> GetUserInfoByID(int id) {
            var user = await context.Users.FindAsync(id);

            if (user == null) return NotFound();

            return Ok(new {
                user.UserID, user.UserName, user.UserEmail, user.UserIconPath
            });
        }


        [HttpGet("pfpPath/{userID}")]

        public async Task<IActionResult> GetPfpPath(int userID) {
            var user = await context.Users.FindAsync(userID);

            if (user == null) return NotFound();

            var path = user.UserIconPath;

            return Ok(path);
        }
    }
}