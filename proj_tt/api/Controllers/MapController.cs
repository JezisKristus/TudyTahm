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


namespace TT_API.Controllers {

    [ApiController]
    [Route("api/[controller]")]

    public class MapController : ControllerBase {

        MyContext context = new MyContext();


        [HttpGet("ByUserID/{userID}")]
        public async Task<IActionResult> GetMapsByUser(int userID) {
            var maps = await context.Maps
                .Where(m => m.IDUser == userID)
                .ToListAsync();

            return Ok(maps);
        }

        [HttpGet("ByMapID/{mapID}")]

        public async Task<IActionResult> GetMap(int mapID) {
            var map = await context.Maps
                .FindAsync(mapID);

            return Ok(map);
        }


        [HttpPost]
        //potrebuje jeste implementaci custom map obrazku, zatim predavej nejakej string do MapPath
        public async Task<IActionResult> AddMap([FromBody] CreateMapDTO dto) {
            Map map = new Map() {

                IDUser = dto.IDUser,
                IsCustom = dto.IsCustom,
                MapName = dto.MapName,
                MapPath = dto.MapPath,
                MapPreviewPath = @"bg.jpg"
            };

            context.Maps.Add(map);

            await context.SaveChangesAsync();

            return Ok(map.MapID);
        }

        

        [HttpDelete("{mapID}")]

        public async Task<IActionResult> DeleteMap(int mapID) {

            var mapToDelete = await context.Maps.FindAsync(mapID);

            try {
                context.Maps.Remove(mapToDelete);
            } catch {
                return NotFound();
            }

            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpPut("RenameMap/{mapID}")]
        public async Task<IActionResult> UpdateMapInfo([FromBody] string mapName, int mapID) {
            var map = await context.Maps.FindAsync(mapID);

            if (map == null) return NotFound();

            map.MapName = mapName;

            await context.SaveChangesAsync();

            return Ok(map.MapID);
        }

        //[HttpPut("UploadMapPreview/{mapID}")]

        //public async Task<IActionResult> UploadPreview([FromForm] IFormFile image, int mapID) {

        //    var map = await context.Maps.FindAsync(mapID);


        //}
    }
}
