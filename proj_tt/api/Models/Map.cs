using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class Map
    {

        [Key]
        public int MapID { get; set; }
        public int IDUser { get; set; }
        public string MapName { get; set; }
        public string MapIcon { get; set; }
    }
}
