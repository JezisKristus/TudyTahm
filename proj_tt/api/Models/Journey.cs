using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace TT_API.Models
{
    public class Journey
    {
        [Key]
        public int JourneyID { get; set; }
        public string Description { get; set; }
        public int IDMap { get; set; }

        [ForeignKey("IDMap")]
        public Map Map { get; set; }
    }
}
