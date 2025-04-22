using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class JourneyGroup
    {
        [Key]
        public int IdGroup { get; set; }
        public int IdJourney { get; set; }
    }
}
