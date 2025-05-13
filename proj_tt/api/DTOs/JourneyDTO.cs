using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using TT_API.Models;

namespace TT_API.DTOs {
    public class JourneyDTO {
        public string Description { get; set; }
        public int IDMap { get; set; }
    }
}
