using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Tls;
using TT_API.Models;
using TT_API.Services;
using TT_API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace TT_API.Controllers {

    [ApiController]

    [Route("api/[controller]")]
    public class LabelController : ControllerBase {
        private MyContext context = new MyContext();

        [HttpPost]
        public async Task<IActionResult> CreateLabel([FromBody] LabelDTO dto) {
            Label label = new Label() {
                Color = dto.Color,
                Name = dto.Name,
            };

            await context.Labels.AddAsync(label);
            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpPut("{labelID}")]
        public async Task<IActionResult> UpdateLabel([FromBody] LabelDTO dto, int labelID) {
            var label = await context.Labels.FindAsync(labelID);

            if (label == null) { return NotFound(); }

            label.Color = dto.Color;
            label.Name = dto.Name;

            await context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{labelID}")]
        public async Task<IActionResult> DeleteLabel(int labelID) {

            var label = await context.Labels.FindAsync(labelID);

            if (label == null) return NotFound();

            var markers = await context.Markers.Where(m => m.IDLabel == labelID).ToListAsync();

            foreach (var marker in markers) {
                marker.IDLabel = 0;
            }

            await context.SaveChangesAsync();

            context.Labels.Remove(label);

            return Ok();
        }

        [HttpGet("ByMapID/{mapID}")]
        public async Task<IActionResult> GetByMapID(int mapID) {

            var labels = await context.Labels.Where(l => l.IDMap == mapID).ToListAsync();

            if (labels == null) return NotFound();

            return Ok(labels);
        }

        [HttpGet("ByMarkerID/{markerID}")]
        public async Task<IActionResult> GetByMarkerID(int markerID) {
            var label = await context.Markers.Include(m => m.Label).Where(l => l.MarkerID == markerID).Select(l => new Label {LabelID = l.Label.LabelID, Name = l.Label.Name, IDMap = l.Label.IDMap, Color = l.Label.Color}).ToListAsync();

            if (label == null) return NotFound(); 

            return Ok(label);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetByID(int id) {

            var label = await context.Labels.FirstOrDefaultAsync(l => l.LabelID == id);

            if (label == null) return NotFound();

            var returnts = new LabelDTO {
                Name = label.Name,
                Color = label.Color,
            };
            
            return Ok(returnts);
        }
    }
}
