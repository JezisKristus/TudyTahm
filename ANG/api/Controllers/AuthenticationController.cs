using JWT.Algorithms;
using JWT.Builder;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Services;
using TT_API.Models;
using TT_API.Services;

namespace TT_API.Controllers {
    [Route("api/[controller]")]
    [ApiController]

    public class AuthenticationController : ControllerBase {
        private TokensService service = new TokensService();

        [HttpPost]
        public IActionResult Login(User user) {
            if (user.UserName == "DebugUser" && user.UserPassword == "123456") {
                string token = this.service.Create(user);

                return Ok(new { token = token });
            }

            return Unauthorized(new { message = "Invalid credentials" });
        }
    }
}
