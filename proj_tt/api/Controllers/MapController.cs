using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Drawing;


namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class MapController : ControllerBase {

        MyContext context = new MyContext();


        [HttpGet]
        public async Task<IActionResult> GetMaps() {
            var maps = context.Maps
                .Where(m => m.IDUser == 6);

            return Ok(maps);
        }
    }
}
