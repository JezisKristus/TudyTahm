using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using System.Web;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class ImageController : ControllerBase
    {
        [HttpGet("{filename}")]
        public IActionResult ReadFile(string filename)
        {

            string filePath = @".\assets\" + filename;

            if (filename.StartsWith(@"L\")) { filePath = @"C:\TT_LOCAL\" + filename.Replace(@"L\", ""); }

            FileInfo file = new FileInfo(filePath);

            // Check if the file exists before attempting to open it
            if (!file.Exists)
            {
                return NotFound(filename); // Return a 404 if the file doesn't exist
            }

            return File(file.OpenRead(), "image/jpeg");
        }

        [HttpPost("CreateNeededDirs")]
        public IActionResult CreateNeededDirs() {
            Directory.CreateDirectory(@"C:\TT_LOCAL\pfp");
            Directory.CreateDirectory(@"C:\TT_LOCAL\map");
            Directory.CreateDirectory(@"C:\TT_LOCAL\preview");
            Directory.CreateDirectory(@"C:\TT_LOCAL\marker");

            return Ok();
        }
    }
}
