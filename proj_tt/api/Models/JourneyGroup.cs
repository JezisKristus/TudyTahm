using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class JourneyGroup
    {
        [Key]
        public int IDGroup { get; set; }
        public int IDJourney { get; set; }
    }
}
