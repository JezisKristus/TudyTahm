using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;


namespace TT_API.Controllers {


    [ApiController]
    [Route("api/[controller]")]

    public class JourneyController : ControllerBase {

        private MyContext context = new MyContext();

        [HttpPost]
        public async Task<IActionResult> CreateJourney([FromBody] JourneyDTO dto) {

            var journey = new Journey() { Name = dto.Name, Description = dto.Description, IDMap = dto.IDMap };

            context.Journeys.Add(journey);

            await context.SaveChangesAsync();

            return Ok(journey.JourneyID);

        }

        [HttpPut("AddPointToJourney/{jourID}")]
        public async Task<IActionResult> AddToJourney([FromBody] PointDTO dto, int jourID) {
            var journey = await context.Journeys.FirstOrDefaultAsync(j => j.JourneyID == jourID);

            if (journey == null) { return NotFound(); }

            JourneyPoint point = new JourneyPoint() {
                IDJourney = jourID,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
            };

            await context.JourneyPoints.AddAsync(point);

            await context.SaveChangesAsync();

            return Ok(point.PointID);
        }

        [HttpDelete("PointFromJourney/{jourID}")]
        public async Task<IActionResult> RemoveFromJourney([FromBody] int pointID ,int jourID) {
            var journey = await context.Journeys.FirstOrDefaultAsync(j => j.JourneyID == jourID);

            if (journey == null) { return NotFound(); }

            var point = await context.JourneyPoints.FirstOrDefaultAsync(j => j.PointID == pointID);

            if (point == null) { return NotFound(); }

            context.JourneyPoints.Remove(point);

            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveJourney(int id) {

            var journey = await context.Journeys.FirstOrDefaultAsync(j => j.JourneyID == id);

            if (journey == null) return NotFound();

            var points = await context.JourneyPoints.Where(p => p.IDJourney == id).ToArrayAsync();

            context.JourneyPoints.RemoveRange(points);

            await context.SaveChangesAsync();

            context.Journeys.Remove(journey);

            await context.SaveChangesAsync();

            return Ok();
        }


        [HttpGet("ByMapID/{mapID}")]
        public async Task<IActionResult> GetJourneyByMap(int mapID) {
            var journeys = await context.Journeys.Where(j => j.IDMap == mapID).ToListAsync();

            if (journeys == null) return NotFound();

            return Ok(journeys);
        }

        [HttpGet("ByUserID/{userID}")]
        public async Task<IActionResult> GetJourneyByUser(int userID)
        {
            var journeys = await context.Journeys
                .Include(j => j.Map)
                .Where(j => j.Map.IDUser == userID)
                .ToListAsync();

            if (!journeys.Any())
                return NotFound();

            return Ok(journeys);
        }


        [HttpGet("Points/{jourID}")]
        public async Task<IActionResult> GetPoints(int jourID) {
            var points = await context.JourneyPoints.Where(p => p.IDJourney == jourID).ToListAsync();

            if (points == null) return NotFound();

            return Ok(points);
        }
    }
}
