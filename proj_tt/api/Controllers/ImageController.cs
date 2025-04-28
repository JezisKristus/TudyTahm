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

    public class ImageController : ControllerBase {

        [HttpGet("{filename}")]
        public IActionResult ReadFile(string filename) {

            FileInfo file = new FileInfo(@".\assets\" + filename);
            return File(file.OpenRead(), "image/jpeg");
        }

    }
}
