using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TT_API.DTOs;
using TT_API.HelperClasses;
using TT_API.Models;
using TT_API.Services;

namespace TT_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class AuthenticationController : ControllerBase
    {
        private TokensService service = new TokensService();

        MyContext context = new MyContext();

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO logindto)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.UserName == logindto.Username);

            if (user == null) { return NotFound(new { message = "User not found." }); }

            if (!HashHelper.Verify(logindto.Password, user.UserPassword)) { return Unauthorized(new { message = "Invalid credentials." }); }

            var token = service.Create(user);
            var refreshToken = service.CreateRefreshToken(user);

            return Ok(new { 
                token, 
                refreshToken, 
                user = new {
                    user.UserID,
                    user.UserName,
                    user.UserEmail,
                    user.UserIconPath
                }
            });
        }

        [HttpPost("RefreshToken")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDTO dto)
        {
            try
            {
                var user = await context.Users.FirstOrDefaultAsync(u => u.UserID == dto.UserID);
                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Verify the refresh token
                if (!service.VerifyRefreshToken(dto.RefreshToken, user))
                {
                    return Unauthorized(new { message = "Invalid refresh token." });
                }

                // Generate new tokens
                var newToken = service.Create(user);
                var newRefreshToken = service.CreateRefreshToken(user);

                return Ok(new { token = newToken, refreshToken = newRefreshToken });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to refresh token", error = ex.Message });
            }
        }

        [HttpPost("Register")]

        //adduser
        public async Task<IActionResult> Register([FromBody] CreateUpdateUserDTO registerdto)
        {
            User user = new User()
            {
                UserName = registerdto.UserName,
                UserPassword = HashHelper.Hash(registerdto.UserPassword),
                UserEmail = registerdto.UserEmail,
                UserIconPath = @"L\pfp\default.png",
            };

            context.Users.Add(user);

            await context.SaveChangesAsync();

            return Ok(user.UserID);
        }


        [Authorize]
        [HttpPut("UpdateUser/{userID}")]
        public async Task<IActionResult> UpdateUser([FromBody] CreateUpdateUserDTO dto, int userID)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await context.Users.FindAsync(userID);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.UserName)) user.UserName = dto.UserName;
            if (!string.IsNullOrEmpty(dto.UserEmail)) user.UserEmail = dto.UserEmail;
            if (!string.IsNullOrEmpty(dto.UserIconPath)) user.UserIconPath = dto.UserIconPath;

            try
            {
                await context.SaveChangesAsync();
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to update user", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("ChangePassword/{userID}")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto, int userID)
        {
            var user = await context.Users.FindAsync(userID);

            if (user == null) return NotFound();

            if (HashHelper.Verify(dto.NewPassword, user.UserPassword))
            {
                return BadRequest(new { code = 68, message = "Password is already in use." });
            }

            if (!HashHelper.Verify(dto.OldPassword, user.UserPassword))
            {
                return BadRequest(new { code = 69, message = "Old password is incorrect." });
            }

            user.UserPassword = HashHelper.Hash(dto.NewPassword);
            await context.SaveChangesAsync();

            return Ok(user);
        }


        [Authorize]
        [HttpPut("UploadPFP/{userID}")]
        public async Task<IActionResult> UploadPFP(IFormFile image, int userID)
        {

            var help = new ImageHelper();

            var user = await context.Users.FindAsync(userID);

            if (user == null) return NotFound();

            var extension = Path.GetExtension(image.FileName).ToLower();

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only JPG and PNG are allowed." });
            }

            if (image != null && image.Length > 0)
            {
                var filename = @"pfp\" + user.UserID + "_" + user.UserName.ToLower().Replace(' ', '-') + extension;

                help.UploadImageLocal(filename, image);

                user.UserIconPath = @"L\" + filename;

                await context.SaveChangesAsync();

                return Ok();
            }

            return BadRequest();
        }

        //[HttpPut("SetDefaultPFP/{userID}")]
        //public async Task<IActionResult> DefaultPFP(int userID) {
        //    var user = await context.Users.FindAsync(userID);


        //}

        [Authorize]
        [HttpGet("UserIDByToken")]
        public async Task<IActionResult> GetUserInfoByToken()
        {
            var identity = User.Identity as ClaimsIdentity;

            return Ok(identity.FindFirst("userID").Value);
        }

        [Authorize]
        [HttpGet("UserInfoByID/{id}")]
        public async Task<IActionResult> GetUserInfoByID(int id)
        {
            var user = await context.Users.FindAsync(id);

            if (user == null) return NotFound();

            return Ok(new
            {
                user.UserID,
                user.UserName,
                user.UserEmail,
                user.UserIconPath
            });
        }

        [Authorize]
        [HttpGet("pfpPath/{userID}")]

        public async Task<IActionResult> GetPfpPath(int userID)
        {
            var user = await context.Users.FindAsync(userID);

            if (user == null) return NotFound();

            var path = user.UserIconPath;

            return Ok(path);
        }
    }
}