using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;


namespace TT_API.Controllers {


    [ApiController]
    [Route("api/[controller]")]

    public class GPSPointController : ControllerBase {

        private MyContext context = new MyContext();

        [HttpGet("{id}")]
        public async Task<ActionResult<GPSPoint>> GetGPSPoint(int id) {
            var gpsPoint = await context.GPSPoints.FindAsync(id);

            return Ok(gpsPoint);
        }

    }
}
